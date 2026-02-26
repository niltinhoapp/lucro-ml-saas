import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// ✅ DICA: valida um segredo simples e eficaz
function assertSecret(req: Request) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const got = req.headers.get("x-webhook-secret");
  return Boolean(secret && got && got === secret);
}

type MPWebhookPayload = {
  type?: string;
  action?: string;
  data?: { id?: string };
  id?: string; // alguns formatos podem vir assim
};

async function fetchPreapprovalDetails(preapprovalId: string) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN!;
  const res = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`MP details error: ${res.status} ${txt}`);
  }

  return res.json();
}

function mapPlanFromStatus(status?: string) {
  // MP costuma usar: authorized, paused, cancelled (às vezes: pending)
  if (!status) return null;

  const s = String(status).toLowerCase();

  if (s === "authorized" || s === "active") return "pro";
  if (s === "paused" || s === "cancelled") return "free_blocked";

  // pending / in_process: não muda nada
  return null;
}

export async function POST(req: Request) {
  try {
    if (!assertSecret(req)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const payload = (await req.json()) as MPWebhookPayload;

    // MP pode mandar em diferentes formatos
    const preapprovalId = payload?.data?.id ?? payload?.id;
    const type = payload?.type ?? "unknown";
    const action = payload?.action ?? "unknown";

    if (!preapprovalId) {
      return NextResponse.json({ ok: true, ignored: true, reason: "no_id" });
    }

    // Busca detalhes oficiais no MP (server-to-server)
    const details = await fetchPreapprovalDetails(preapprovalId);

    const status = details?.status as string | undefined;
    const userId = details?.external_reference as string | undefined;

    if (!userId) {
      return NextResponse.json({ ok: true, ignored: true, reason: "no_external_reference", status });
    }

    const plan = mapPlanFromStatus(status);

    // Se não for um status que altere plano, só confirma
    if (!plan) {
      return NextResponse.json({ ok: true, ignored: true, type, action, status });
    }

    // ✅ Idempotência básica:
    // - Se já está pro e veio "pro" de novo, ok.
    // - Se já está bloqueado e veio bloqueado de novo, ok.
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();

    if (profileErr) {
      return NextResponse.json({ ok: false, error: "profile_not_found", details: profileErr.message }, { status: 200 });
    }

    if (profile?.plan === plan) {
      return NextResponse.json({ ok: true, idempotent: true, type, action, status, userId, plan });
    }

    const { error: updErr } = await supabaseAdmin
      .from("profiles")
      .update({ plan })
      .eq("id", userId);

    if (updErr) {
      return NextResponse.json({ ok: false, error: updErr.message }, { status: 200 });
    }

    return NextResponse.json({ ok: true, type, action, status, userId, plan });
  } catch (e: any) {
    // Webhook não deve ficar retornando 500 toda hora (MP vai reenviar)
    return NextResponse.json({ ok: false, error: e?.message ?? "unknown" }, { status: 200 });
  }
}