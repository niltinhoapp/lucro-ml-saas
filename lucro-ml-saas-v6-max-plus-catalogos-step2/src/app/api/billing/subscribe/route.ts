import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createSubscriptionLink } from "@/services/mercadopago";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const sb = await supabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    const body = await req.json();
    const plan = body?.plan as "pro_month" | "pro_year" | "plus_month" | "plus_year";

    if (!plan) {
      return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
    }

    const email =
      user.email ||
      body?.payerEmail ||
      "";

    if (!email) {
      return NextResponse.json({ error: "E-mail do pagador não encontrado." }, { status: 400 });
    }

    const data = await createSubscriptionLink({
      payerEmail: email,
      userId: user.id,
      plan,
    });

    await sb.from("subscriptions").insert({
      user_id: user.id,
      provider: "mercadopago",
      provider_id: data.id ?? null,
      plan,
      status: data.status ?? "pending",
      payer_email: email,
      init_point: data.init_point ?? null,
    });

    return NextResponse.json({
      ok: true,
      checkoutUrl: data.init_point,
      preapprovalId: data.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar assinatura.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}