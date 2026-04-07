export type UserPlan = "free" | "preview" | "pro" | "plus";

export function showProUpgrade(plan: UserPlan) {
  return plan === "free" || plan === "preview";
}

export function showPlusUpgrade(plan: UserPlan) {
  return plan === "free" || plan === "preview" || plan === "pro";
}

export function showAnyUpgrade(plan: UserPlan) {
  return showProUpgrade(plan) || showPlusUpgrade(plan);
}





