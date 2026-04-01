export const runtime = "nodejs";

import { priceFromSubscriptionPlan, type SubscriptionPlan } from "@/lib/plans";

type CreateSubParams = {
  payerEmail: string;
  userId: string;
  plan?: SubscriptionPlan;
};

type MPPreapprovalResponse = {
  id?: string;
  init_point?: string;
  status?: string;
};

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function getSiteUrl() {
  const raw = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) throw new Error("Missing SITE_URL");

  const clean = raw.replace(/\/+$/, "");

  try {
    new URL(clean);
    return clean;
  } catch {
    throw new Error(`Invalid SITE_URL: ${clean}`);
  }
}

export async function mpCreateSubscription(
  params: CreateSubParams
): Promise<MPPreapprovalResponse> {
  const accessToken = mustEnv("MERCADOPAGO_ACCESS_TOKEN");
  const webhookSecret = mustEnv("MERCADOPAGO_WEBHOOK_SECRET");

  const plan = params.plan ?? "pro_month";
  const { amount, freq, label } = priceFromSubscriptionPlan(plan);

  const site = getSiteUrl();

  const notificationUrl = `${site}/api/mp/webhook?secret=${encodeURIComponent(
    webhookSecret
  )}`;

  const backUrl = `${site}/app/billing/success`;

  const payload = {
    reason: `Lucro ML — ${label}`,
    external_reference: `${params.userId}:${plan}`,
    payer_email: params.payerEmail,
    auto_recurring: {
      frequency: freq,
      frequency_type: "months",
      transaction_amount: amount,
      currency_id: "BRL",
    },
    back_url: backUrl,
    status: "pending",
    notification_url: notificationUrl,
  };

  console.log("[MP] create subscription", {
    plan,
    payerEmail: params.payerEmail,
    userId: params.userId,
    site,
    backUrl,
    notificationUrl,
  });

  const res = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await res.text().catch(() => "");
  let json: MPPreapprovalResponse | null = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    console.error("[MP] preapproval error", {
      status: res.status,
      body: text,
    });

    throw new Error(
      `MP preapproval error: ${res.status} ${text || "unknown_error"}`
    );
  }

  console.log("[MP] preapproval ok", {
    status: res.status,
    id: json?.id,
    init_point: json?.init_point,
    mp_status: json?.status,
  });

  return {
    id: json?.id,
    init_point: json?.init_point,
    status: json?.status,
  };
}



