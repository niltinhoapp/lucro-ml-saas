export type ProfilePlan = "free" | "pro" | "plus" | "free_blocked";
export type SubscriptionPlan =
  | "pro_month"
  | "pro_year"
  | "plus_month"
  | "plus_year";

export type PlanSpec = {
  id: ProfilePlan;
  label: string;
  rank: number;
  reportsLimit: number;
  canExport: boolean;
  canUploadSpreadsheet: boolean;
  canUseCatalogAnalysis: boolean;
  aiDailyLimit: number;
};

export const PLAN_SPECS: Record<ProfilePlan, PlanSpec> = {
  free: {
    id: "free",
    label: "Free",
    rank: 0,
    reportsLimit: 2,
    canExport: false,
    canUploadSpreadsheet: false,
    canUseCatalogAnalysis: false,
    aiDailyLimit: 5,
  },
  free_blocked: {
    id: "free_blocked",
    label: "Free bloqueado",
    rank: 0,
    reportsLimit: 0,
    canExport: false,
    canUploadSpreadsheet: false,
    canUseCatalogAnalysis: false,
    aiDailyLimit: 0,
  },
  pro: {
    id: "pro",
    label: "PRO",
    rank: 1,
    reportsLimit: 999999,
    canExport: true,
    canUploadSpreadsheet: true,
    canUseCatalogAnalysis: false,
    aiDailyLimit: 60,
  },
  plus: {
    id: "plus",
    label: "PLUS",
    rank: 2,
    reportsLimit: 999999,
    canExport: true,
    canUploadSpreadsheet: true,
    canUseCatalogAnalysis: true,
    aiDailyLimit: 250,
  },
};

export function normalizeProfilePlan(plan: string | null | undefined): ProfilePlan {
  const value = String(plan ?? "free").toLowerCase();
  if (value === "plus") return "plus";
  if (value === "pro") return "pro";
  if (value === "free_blocked") return "free_blocked";
  return "free";
}

export function isSubscriptionPlan(value: string): value is SubscriptionPlan {
  return ["pro_month", "pro_year", "plus_month", "plus_year"].includes(value);
}

export function subscriptionPlanToProfilePlan(plan: SubscriptionPlan): ProfilePlan {
  return plan.startsWith("plus") ? "plus" : "pro";
}

export function priceFromSubscriptionPlan(plan: SubscriptionPlan) {
  switch (plan) {
    case "pro_year":
      return { amount: 299.9, freq: 12, label: "PRO Anual" };
    case "plus_month":
      return { amount: 79.9, freq: 1, label: "PLUS Mensal" };
    case "plus_year":
      return { amount: 799.9, freq: 12, label: "PLUS Anual" };
    case "pro_month":
    default:
      return { amount: 29.9, freq: 1, label: "PRO Mensal" };
  }
}
