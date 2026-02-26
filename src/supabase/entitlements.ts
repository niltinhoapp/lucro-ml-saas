type Entitlements = {
  isPro: boolean;
  trialActive: boolean;
  trialExpired: boolean;
  canUseApp: boolean;       // pode ficar no dashboard
  canCreateReports: boolean; // limitado no free
  canExport: boolean;       // PRO somente
  maxReports: number;
};

export async function getEntitlements(supabase: any, userId: string): Promise<Entitlements> {
  const { data, error } = await supabase
    .from("profiles")
    .select("plan, trial_ends_at, pro_until")
    .eq("id", userId)
    .single();

  if (error || !data) {
    // se der ruim, bloqueia por segurança
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
  const trialEnds = new Date(data.trial_ends_at).getTime();
  const trialActive = now <= trialEnds;

  const isPro =
    data.plan === "pro" ||
    (data.pro_until ? now <= new Date(data.pro_until).getTime() : false);

  const trialExpired = !trialActive;

  // ✅ Regra do seu SaaS:
  // - Pode usar app se Pro OU trial ativo
  // - Após expirar: loga, mas app "bloqueado" (manda pro checkout)
  const canUseApp = isPro || trialActive;

  return {
    isPro,
    trialActive,
    trialExpired,
    canUseApp,
    canCreateReports: isPro || trialActive, // mas vamos limitar quantidade no free
    canExport: isPro,
    maxReports: isPro ? 999999 : 3,
  };
}