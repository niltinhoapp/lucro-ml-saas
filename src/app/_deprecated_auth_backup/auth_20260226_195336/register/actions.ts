"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/supabase/server";

function safeNext(next?: string | null) {
  if (!next) return "/dashboard";
  if (!next.startsWith("/")) return "/dashboard";
  if (next.startsWith("//")) return "/dashboard";
  return next;
}

export async function registerAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? "") || null);

  if (!email || !password) {
    redirect(`/auth/register?error=${encodeURIComponent("Preencha email e senha.")}&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createServerClient();

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/auth/register?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  // se o projeto exigir confirmação de email, aqui o usuário pode não estar logado ainda
  // por enquanto, manda pro login para garantir
  redirect(`/auth/login?next=${encodeURIComponent(next)}`);
}
