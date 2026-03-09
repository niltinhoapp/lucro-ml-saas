"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/supabase/server";

export async function logoutAction() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
