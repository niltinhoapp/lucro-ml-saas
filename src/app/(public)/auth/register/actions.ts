"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServerClient } from "@/integrations/supabase/server";

function safeNext(next?: string | null) {
  if (!next) return "/dashboard";
  if (!next.startsWith("/")) return "/dashboard";
  if (next.startsWith("//")) return "/dashboard";
  return next;
}

async function getOrigin() {
  const h = await headers();

  const origin = h.get("origin");
  if (origin) return origin;

  const forwardedProto = h.get("x-forwarded-proto");
  const forwardedHost = h.get("x-forwarded-host");

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = h.get("host");
  if (host) {
    const protocol = host.includes("localhost") ? "http" : "https";
    return `${protocol}://${host}`;
  }

  return (
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  );
}

export async function registerAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? "") || null);

  if (!email || !password) {
    redirect(
      `/auth/register?error=${encodeURIComponent(
        "Preencha email e senha."
      )}&next=${encodeURIComponent(next)}`
    );
  }

  const supabase = await createServerClient();

  const origin = await getOrigin();
  const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(
    next
  )}`;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });

  if (error) {
    redirect(
      `/auth/register?error=${encodeURIComponent(
        error.message
      )}&next=${encodeURIComponent(next)}`
    );
  }

  redirect(`/auth/register?check=1&next=${encodeURIComponent(next)}`);
}



