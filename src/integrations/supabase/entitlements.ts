import { SupabaseClient } from "@supabase/supabase-js";
import { PLAN_SPECS, normalizeProfilePlan, type ProfilePlan } from "@/lib/plans";

type Entitlements = {
  plan: ProfilePlan;
  isPro: boolean;
  isPlus: boolean;
  hasPaidAccess: boolean;
  trialActive: boolean;
  trialExpired: boolean;

  canUseApp: boolean;
  canCreateReports: boolean;
  canExport: boolean;
  canUploadSpreadsheet: boolean;
  canUseCatalogAnalysis: boolean;
  canAccessStrategies: boolean;

  maxReports: number;
  aiDailyLimit: number;
};

export async function getEntitlements(
  supabase: SupabaseClient,
  userId: string
): Promise<Entitlements> {
  if (process.env.FORCE_ALL_USERS_PLUS === "true") {
    return {
      plan: "plus",
      isPro: false,
      isPlus: true,
      hasPaidAccess: true,
      trialActive: false,
      trialExpired: false,

      canUseApp: true,
      canCreateReports: true,
      canExport: true,
      canUploadSpreadsheet: true,
      canUseCatalogAnalysis: true,
      canAccessStrategies: true,

      maxReports: 999999,
      aiDailyLimit: 999999,
    };
  }

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
      plan: "free_trial",
      isPro: false,
      isPlus: false,
      hasPaidAccess: false,
      trialActive: false,
      trialExpired: true,

      canUseApp: false,
      canCreateReports: false,
      canExport: false,
      canUploadSpreadsheet: false,
      canUseCatalogAnalysis: false,
      canAccessStrategies: false,

      maxReports: 0,
      aiDailyLimit: 0,
    };
  }

  const now = Date.now();
  const plan = normalizeProfilePlan(data.plan);
  const spec = PLAN_SPECS[plan];

  const trialEnds = data.trial_ends_at
    ? new Date(data.trial_ends_at).getTime()
    : 0;

  const trialActive = trialEnds > now;
  const trialExpired = !trialActive;

  const explicitProTime = data.pro_until
    ? now <= new Date(data.pro_until).getTime()
    : false;

  const isPro = plan === "pro";
  const isPlus = plan === "plus";
  const hasPaidAccess = isPro || isPlus || explicitProTime;

  return {
    plan,
    isPro,
    isPlus,
    hasPaidAccess,
    trialActive,
    trialExpired,

    canUseApp: hasPaidAccess || trialActive,
    canCreateReports: hasPaidAccess || trialActive,
    canExport: hasPaidAccess ? spec.canExport : false,
    canUploadSpreadsheet: hasPaidAccess ? spec.canUploadSpreadsheet : false,

    canUseCatalogAnalysis: isPlus,
    canAccessStrategies: isPlus,

    maxReports: hasPaidAccess
      ? spec.reportsLimit
      : PLAN_SPECS.free_trial.reportsLimit,

    aiDailyLimit: hasPaidAccess
      ? spec.aiDailyLimit
      : PLAN_SPECS.free_trial.aiDailyLimit,
  };
}



