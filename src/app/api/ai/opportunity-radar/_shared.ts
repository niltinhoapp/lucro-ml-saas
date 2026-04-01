
import { NextResponse } from "next/server";
import { createServerClient } from "@/integrations/supabase/server";
import { getEntitlements } from "@/integrations/supabase/entitlements";

export async function validatePlusRadarAccess() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      error: NextResponse.json({ ok: false, error: "Faça login para continuar." }, { status: 401 }),
    };
  }

  const ent = await getEntitlements(supabase, user.id);
  if (!ent.isPlus) {
    return {
      supabase,
      user: null,
      error: NextResponse.json({ ok: false, error: "Disponível apenas no plano PLUS." }, { status: 403 }),
    };
  }

  return { supabase, user, error: null };
}

export function apiError(message: string, error: unknown, status = 500) {
  const detail = error instanceof Error ? error.message : "Erro desconhecido";
  return NextResponse.json({ ok: false, error: message, detail }, { status });
}

export function numberOrZero(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}



