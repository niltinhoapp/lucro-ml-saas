// /lib/auth/getEntitlementsServer.ts

import { createServerClient } from "@/integrations/supabase/server";
import { getEntitlements } from "@/integrations/supabase/entitlements";

export async function getEntitlementsServer() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return getEntitlements(supabase, user.id);
}
