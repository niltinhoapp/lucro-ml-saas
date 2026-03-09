// src/app/api/mp/create-subscription/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/supabase/server";
import { mpCreateSubscription } from "@/services/mercadopago";
import { isSubscriptionPlan, type SubscriptionPlan } from "@/lib/plans";

type Body = {
  plan?: SubscriptionPlan;
};

export async function POST(req: Request) {
  const supabase = await createServerClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user?.id || !user.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!token) {
    return NextResponse.json(
      { error: "MERCADOPAGO_ACCESS_TOKEN não configurado." },
      { status: 500 }
    );
  }

  if (!siteUrl) {
    return NextResponse.json(
      { error: "SITE_URL não configurado." },
      { status: 500 }
    );
  }

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "MERCADOPAGO_WEBHOOK_SECRET não configurado." },
      { status: 500 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const plan = body.plan && isSubscriptionPlan(body.plan) ? body.plan : "pro_month";

  try {
    const mp = await mpCreateSubscription({
      payerEmail: user.email,
      userId: user.id,
      plan,
    });

    const { error: subErr } = await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        payer_email: user.email,
        plan,
        provider: "mercadopago",
        provider_id: mp.id ?? null,
        status: "pending",
        init_point: mp.init_point ?? null,
      },
      {
        onConflict: "user_id,provider",
      }
    );

    if (subErr) {
      console.error("[MP] subscriptions upsert error:", subErr.message);
    }

    return NextResponse.json({
      init_point: mp.init_point ?? null,
      subscription_id: mp.id ?? null,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Falha ao criar assinatura";
    console.error("[MP] create-subscription error:", msg);

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}