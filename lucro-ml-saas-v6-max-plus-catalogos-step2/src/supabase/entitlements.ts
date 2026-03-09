import { SupabaseClient } from "@supabase/supabase-js";
import { PLAN_SPECS, normalizeProfilePlan, type ProfilePlan } from "@/lib/plans";

type Entitlements = {
  plan: ProfilePlan;
  isPro: boolean;
  isPlus: boolean;
  trialActive: boolean;
  trialExpired: boolean;

  canUseApp: boolean;
  canCreateReports: boolean;
  canExport: boolean;
  canUploadSpreadsheet: boolean;
  canUseCatalogAnalysis: boolean;

  maxReports: number;
  aiDailyLimit: number;
};

export async function getEntitlements(
  supabase: SupabaseClient,
  userId: string
): Promise<Entitlements> {
  const { data, error } = await supabase
    .from("profiles")
    .select("plan, trial_ends_at, pro_until")
    .eq("id", userId)
    .single<{
      plan: string | null;
      trial_ends_at: string | null;
      pro_until: string | null;
    }>();

  if (error || !data) {
    return {
      plan: "free",
      isPro: false,
      isPlus: false,
      trialActive: false,
      trialExpired: true,
      canUseApp: false,
      canCreateReports: false,
      canExport: false,
      canUploadSpreadsheet: false,
      canUseCatalogAnalysis: false,
      maxReports: 0,
      aiDailyLimit: 0,
    };
  }

  const now = Date.now();
  const plan = normalizeProfilePlan(data.plan);
  const spec = PLAN_SPECS[plan];

  const trialEnds = data.trial_ends_at ? new Date(data.trial_ends_at).getTime() : 0;
  const trialActive = trialEnds > now;

  const explicitProTime = data.pro_until ? now <= new Date(data.pro_until).getTime() : false;
  const isPaidPlan = plan === "pro" || plan === "plus" || explicitProTime;
  const isPlus = plan === "plus";
  const isPro = isPaidPlan;
  const trialExpired = !trialActive;

  return {
    plan,
    isPro,
    isPlus,
    trialActive,
    trialExpired,
    canUseApp: isPaidPlan || trialActive,
    canCreateReports: isPaidPlan || trialActive,
    canExport: isPaidPlan ? spec.canExport : false,
    canUploadSpreadsheet: isPaidPlan ? spec.canUploadSpreadsheet : false,
    canUseCatalogAnalysis: plan === "plus",
    maxReports: isPaidPlan ? spec.reportsLimit : PLAN_SPECS.free.reportsLimit,
    aiDailyLimit: isPaidPlan ? spec.aiDailyLimit : PLAN_SPECS.free.aiDailyLimit,
  };
}
