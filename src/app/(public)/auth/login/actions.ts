"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/supabase/server";

function safeNext(next?: string | null) {
  if (!next) return "/dashboard";
  if (!next.startsWith("/")) return "/dashboard";
  if (next.startsWith("//")) return "/dashboard";
  return next;
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? "") || null);

  if (!email || !password) {
    redirect(
      `/auth/login?error=${encodeURIComponent("Preencha email e senha.")}&next=${encodeURIComponent(next)}`
    );
  }

  const supabase = await createServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const msg = encodeURIComponent(error.message);
    redirect(`/auth/login?next=${encodeURIComponent(next)}&error=${msg}`);
  }

  redirect(next);
}