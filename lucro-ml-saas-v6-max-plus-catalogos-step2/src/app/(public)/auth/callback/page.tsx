import { redirect } from "next/navigation";
import { createServerClient } from "@/supabase/server";

function safeNext(next?: string | null) {
  if (!next) return "/dashboard";
  if (!next.startsWith("/")) return "/dashboard";
  if (next.startsWith("//")) return "/dashboard";
  return next;
}

type Props = {
  searchParams: Promise<{
    code?: string;
    next?: string;
  }>;
};

export default async function AuthCallbackPage(props: Props) {
  const sp = await props.searchParams;

  const code = sp.code;
  const next = safeNext(sp.next ?? "/dashboard");

  if (!code) {
    redirect(`/auth/login?error=${encodeURIComponent("Código de autenticação ausente.")}&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}