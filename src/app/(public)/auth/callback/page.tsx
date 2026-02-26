import { redirect } from "next/navigation";
import { createServerClient } from "@/supabase/server";

export default async function AuthCallbackPage({ searchParams }: { searchParams: { code?: string } }) {
  const code = searchParams.code;
  if (!code) redirect("/login");

  const supabase = await createServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) redirect("/login");
  redirect("/dashboard");
}