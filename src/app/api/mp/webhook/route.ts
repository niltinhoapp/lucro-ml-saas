// src/app/api/mp/webhook/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type MPWebhookPayload = {
  type?: string;
  action?: string;
  data?: { id?: string };
  id?: string;
  topic?: string;
};

function assertSecret(req: Request) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const url = new URL(req.url);
  const got = url.searchParams.get("secret");
  return Boolean(secret && got && got === secret);
}

async function fetchPreapprovalDetails(preapprovalId: string) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Missing MERCADOPAGO_ACCESS_TOKEN");

  const res = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const txt = await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error(`MP details error: ${res.status} ${txt}`);
  }

  try {
    return txt ? JSON.parse(txt) : {};
  } catch {
    throw new Error("MP details error: invalid_json");
  }
}

function mapPlanFromStatus(status?: string) {
  const s = String(status ?? "").toLowerCase();

  if (s === "authorized" || s === "active") return "pro";
  if (s === "paused" || s === "cancelled" || s === "canceled") return "free_blocked";

  // pending / in_process / trialing / etc
  return null;
}

export async function POST(req: Request) {
  try {
    if (!assertSecret(req)) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const payload = (await req.json().catch(() => ({}))) as MPWebhookPayload;

    const preapprovalId = payload?.data?.id ?? payload?.id;

    if (!preapprovalId) {
      return NextResponse.json(
        { ok: true, ignored: true, reason: "no_id" },
        { status: 200 }
      );
    }

    const details = await fetchPreapprovalDetails(preapprovalId);

    const status = details?.status as string | undefined;
    const userId = details?.external_reference as string | undefined;
    const payerEmail = details?.payer_email as string | undefined;

    console.log("[MP webhook] received", {
      preapprovalId,
      status,
      userId,
      payerEmail,
      type: payload?.type,
      action: payload?.action,
    });

    if (!userId) {
      return NextResponse.json(
        { ok: true, ignored: true, reason: "no_external_reference", status },
        { status: 200 }
      );
    }

    const plan = mapPlanFromStatus(status);

    // sempre tenta sincronizar subscriptions, mesmo se plan for null
    const { error: subErr } = await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: userId,
        provider: "mercadopago",
        provider_id: preapprovalId,
        plan: plan ?? null,
        status: status ?? "unknown",
        payer_email: payerEmail ?? null,
      },
      {
        onConflict: "provider_id",
      }
    );

    if (subErr) {
      console.error("[MP webhook] subscriptions upsert error:", subErr.message);
    }

    // status que não muda plano do usuário
    if (!plan) {
      return NextResponse.json(
        { ok: true, ignored: true, reason: "status_no_plan_change", status },
        { status: 200 }
      );
    }

    // lê plano atual
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();

    if (profileErr) {
      return NextResponse.json(
        {
          ok: false,
          error: "profile_not_found",
          details: profileErr.message,
          userId,
          status,
        },
        { status: 200 }
      );
    }

    // idempotência
    if (profile?.plan === plan) {
      return NextResponse.json(
        { ok: true, idempotent: true, status, userId, plan },
        { status: 200 }
      );
    }

    const { error: updErr } = await supabaseAdmin
      .from("profiles")
      .update({ plan })
      .eq("id", userId);

    if (updErr) {
      return NextResponse.json(
        { ok: false, error: updErr.message, userId, status, plan },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { ok: true, status, userId, plan },
      { status: 200 }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[MP webhook] fatal:", msg);

    // webhook sempre responde 200 pro MP não reenviar infinitamente
    return NextResponse.json({ ok: false, error: msg }, { status: 200 });
  }
}