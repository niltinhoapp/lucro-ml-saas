import { NextResponse } from "next/server";
import { createAdminClient } from "@/integrations/supabase/admin";
import {
  subscriptionPlanToProfilePlan,
  isSubscriptionPlan,
  type SubscriptionPlan,
} from "@/lib/plans";

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

  const res = await fetch(
    `https://api.mercadopago.com/preapproval/${preapprovalId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

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

function extractPlanFromExternalReference(
  externalReference?: string | null
): SubscriptionPlan | null {
  const raw = String(externalReference ?? "");
  const [, maybePlan] = raw.split(":");

  if (maybePlan && isSubscriptionPlan(maybePlan)) {
    return maybePlan;
  }

  return null;
}

function extractUserIdFromExternalReference(
  externalReference?: string | null
) {
  const raw = String(externalReference ?? "");
  const [userId] = raw.split(":");
  return userId || null;
}

function mapPlanFromStatus(
  status?: string,
  requestedPlan?: string | null
) {
  const s = String(status ?? "").toLowerCase();

  if (s === "authorized" || s === "active") {
    if (requestedPlan && isSubscriptionPlan(requestedPlan)) {
      return subscriptionPlanToProfilePlan(requestedPlan);
    }
    return "pro";
  }

  if (s === "paused" || s === "cancelled" || s === "canceled") {
    return "free_blocked";
  }

  return null;
}

export async function POST(req: Request) {
  try {
    if (!assertSecret(req)) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 }
      );
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
    const externalReference = details?.external_reference as string | undefined;
    const userId = extractUserIdFromExternalReference(externalReference);
    const payerEmail = details?.payer_email as string | undefined;

    if (!userId) {
      return NextResponse.json(
        {
          ok: true,
          ignored: true,
          reason: "no_external_reference",
          status,
        },
        { status: 200 }
      );
    }

    const planFromReference = extractPlanFromExternalReference(
      externalReference
    );

    const { data: existingSub } = await createAdminClient().from("subscriptions")
      .select("plan")
      .or(`provider_id.eq.${preapprovalId},user_id.eq.${userId}`)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ plan: string | null }>();

    const requestedPlan = existingSub?.plan ?? planFromReference ?? null;

    console.log("[MP webhook] received", {
      preapprovalId,
      status,
      userId,
      payerEmail,
      requestedPlan,
      type: payload?.type,
      action: payload?.action,
    });

    const profilePlan = mapPlanFromStatus(status, requestedPlan);

    const { error: subErr } = await createAdminClient().from("subscriptions")
      .upsert(
        {
          user_id: userId,
          provider: "mercadopago",
          provider_id: preapprovalId,
          plan: requestedPlan ?? null,
          status: status ?? "unknown",
          payer_email: payerEmail ?? null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "provider_id",
        }
      );

    if (subErr) {
      console.error("[MP webhook] subscriptions upsert error:", subErr.message);
    }

    if (!profilePlan) {
      return NextResponse.json(
        {
          ok: true,
          ignored: true,
          reason: "status_no_plan_change",
          status,
        },
        { status: 200 }
      );
    }

    const { data: profile, error: profileErr } = await createAdminClient().from("profiles")
      .select("plan")
      .eq("id", userId)
      .single<{ plan: string }>();

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

    if (profile?.plan === profilePlan) {
      return NextResponse.json(
        {
          ok: true,
          idempotent: true,
          status,
          userId,
          plan: profilePlan,
        },
        { status: 200 }
      );
    }

    const { error: updErr } = await createAdminClient().from("profiles")
      .update({ plan: profilePlan })
      .eq("id", userId);

    if (updErr) {
      return NextResponse.json(
        {
          ok: false,
          error: updErr.message,
          userId,
          status,
          plan: profilePlan,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        status,
        userId,
        plan: profilePlan,
      },
      { status: 200 }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[MP webhook] fatal:", msg);

    return NextResponse.json({ ok: false, error: msg }, { status: 200 });
  }
}




