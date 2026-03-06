import { SupabaseClient } from "@supabase/supabase-js";

type Entitlements = {
  isPro: boolean;
  trialActive: boolean;
  trialExpired: boolean;

  canUseApp: boolean;        // pode acessar dashboard
  canCreateReports: boolean; // pode criar relatório (limitado no free)
  canExport: boolean;        // exportar PDF (PRO)

  maxReports: number;        // limite de relatórios
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
      isPro: false,
      trialActive: false,
      trialExpired: true,
      canUseApp: false,
      canCreateReports: false,
      canExport: false,
      maxReports: 0,
    };
  }

  const now = Date.now();

  const trialEnds = data.trial_ends_at
    ? new Date(data.trial_ends_at).getTime()
    : 0;

  const trialActive = trialEnds > now;

  const isPro =
    data.plan === "pro" ||
    (data.pro_until ? now <= new Date(data.pro_until).getTime() : false);

  const trialExpired = !trialActive;

  // Regras do SaaS
  const canUseApp = isPro || trialActive;
  const canCreateReports = isPro || trialActive;
  const canExport = isPro;
  const maxReports = isPro ? 999999 : 2;

  return {
    isPro,
    trialActive,
    trialExpired,
    canUseApp,
    canCreateReports,
    canExport,
    maxReports,
  };
}