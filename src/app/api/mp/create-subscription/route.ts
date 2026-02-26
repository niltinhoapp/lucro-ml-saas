import { NextResponse } from "next/server";
import { createServerClient } from "@/supabase/server";
import { mpCreateSubscription } from "@/services/mercadopago";

export async function POST() {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const mp = await mpCreateSubscription({ payerEmail: user.email, userId: user.id });

  // mp.init_point é o link para o usuário pagar/assinar
  return NextResponse.json({
    init_point: mp.init_point ?? null,
    subscription_id: mp.id ?? null,
  });
}