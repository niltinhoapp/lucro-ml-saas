// /integrations/supabase/entitlements.ts

import { SupabaseClient } from "@supabase/supabase-js";
import {
  PLAN_SPECS,
  normalizeProfilePlan,
  subscriptionPlanToProfilePlan,
  isSubscriptionPlan,
  type ProfilePlan,
} from "@/lib/plans";

type Entitlements = {
  plan: ProfilePlan;
  isPro: boolean;
  isPlus: boolean;
  hasPaidAccess: boolean;

  canUseApp: boolean;
  canCreateReports: boolean;
  canExport: boolean;
  canUploadSpreadsheet: boolean;
  canUseCatalogAnalysis: boolean;
  canUseMlConnection: boolean;

  maxReports: number;
  aiDailyLimit: number;
};

function isActive(status?: string | null) {
  return ["active", "approved", "authorized"].includes(
    String(status ?? "").toLowerCase()
  );
}

export async function getEntitlements(
  supabase: SupabaseClient,
  userId: string
): Promise<Entitlements> {
  const [profileRes, subsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle(),

    supabase
      .from("subscriptions")
      .select("plan, status, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
  ]);

  const profilePlan = normalizeProfilePlan(profileRes.data?.plan);

  const activeSub = (subsRes.data ?? []).find(
    (s) => isActive(s.status) && isSubscriptionPlan(String(s.plan))
  );

  const subscriptionPlan =
    activeSub?.plan && isSubscriptionPlan(activeSub.plan)
      ? subscriptionPlanToProfilePlan(activeSub.plan)
      : null;

  const effectivePlan: ProfilePlan = subscriptionPlan ?? profilePlan;
  const spec = PLAN_SPECS[effectivePlan];

  const isPro = effectivePlan === "pro";
  const isPlus = effectivePlan === "plus";
  const hasPaidAccess = isPro || isPlus;

  return {
    plan: effectivePlan,
    isPro,
    isPlus,
    hasPaidAccess,

    canUseApp: hasPaidAccess,
    canCreateReports: hasPaidAccess,
    canExport: spec.canExport,
    canUploadSpreadsheet: spec.canUploadSpreadsheet,
    canUseCatalogAnalysis: spec.canUseCatalogAnalysis,
    canUseMlConnection: spec.canUseMlConnection,

    maxReports: spec.reportsLimit,
    aiDailyLimit: spec.aiDailyLimit,
  };
}