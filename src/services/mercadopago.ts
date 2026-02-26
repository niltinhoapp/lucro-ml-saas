type CreateSubArgs = {
  payerEmail: string;
  userId: string;
};

export async function mpCreateSubscription({ payerEmail, userId }: CreateSubArgs) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN!;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  // Modelo usando PREAPPROVAL (assinatura)
  const body = {
    reason: "Lucro ML PRO (mensal)",
    payer_email: payerEmail,
    back_url: `${siteUrl}/dashboard`, // depois do pagamento, volta pro app
    external_reference: userId,       // ✅ chave para identificar o usuário
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 29.9,
      currency_id: "BRL",
    },
    status: "pending",
  };

  const res = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`MP preapproval error: ${res.status} ${txt}`);
  }

  return res.json(); // geralmente vem com init_point / id
}