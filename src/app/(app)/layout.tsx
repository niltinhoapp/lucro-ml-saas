import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createServerClient } from "@/supabase/server";
import { getEntitlements } from "@/supabase/entitlements";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard");
  }

  const ent = await getEntitlements(supabase, user.id);

  if (!ent.canUseApp) {
    redirect("/checkout?reason=expired");
  }

  return <>{children}</>;
}