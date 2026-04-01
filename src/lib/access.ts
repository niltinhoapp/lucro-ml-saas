import { createServerClient } from "@/integrations/supabase/server";
import { getEntitlements } from "@/integrations/supabase/entitlements";

export async function requirePlusAccess() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { allowed: false, reason: "not_authenticated" as const };
  }

  const ent = await getEntitlements(supabase, user.id);

  if (!ent.isPlus) {
    return { allowed: false, reason: "insufficient_plan" as const };
  }

  return { allowed: true, user, ent };
}

export async function requireProAccess() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { allowed: false, reason: "not_authenticated" as const };
  }

  const ent = await getEntitlements(supabase, user.id);

  if (!ent.hasPaidAccess) {
    return { allowed: false, reason: "insufficient_plan" as const };
  }

  return { allowed: true, user, ent };
}
