import type { ReactNode } from "react";
import Link from "next/link";
import type { ProfilePlan } from "@/lib/plans";

type EntitlementLike = {
  plan: ProfilePlan;
  isPro: boolean;
  isPlus: boolean;
  hasPaidAccess: boolean;
  canUseApp?: boolean;
  canCreateReports?: boolean;
  canExport?: boolean;
  canUploadSpreadsheet?: boolean;
  canUseCatalogAnalysis?: boolean;
  canUseMlConnection?: boolean;
  canAccessStrategies?: boolean;
};

type Props = {
  ent: EntitlementLike | null | undefined;
  requiredPlan: "pro" | "plus";
  title: string;
  description: string;
  bullets?: string[];
  children: ReactNode;
  backHref?: string;
  upgradeHref?: string;
  showChildrenWhenLocked?: boolean;
};

function planRank(plan: ProfilePlan | undefined) {
  if (plan === "plus") return 2;
  if (plan === "pro") return 1;
  return 0;
}

function hasRequiredAccess(
  ent: EntitlementLike | null | undefined,
  requiredPlan: "pro" | "plus"
) {
  if (!ent) return false;
  return planRank(ent.plan) >= planRank(requiredPlan);
}

function currentPlanLabel(plan?: ProfilePlan) {
  if (plan === "plus") return "PLUS";
  if (plan === "pro") return "PRO";
  if (plan === "free_blocked") return "FREE";
  return "FREE";
}

export default function PlanGate({
  ent,
  requiredPlan,
  title,
  description,
  bullets = [],
  children,
  backHref = "/dashboard",
  upgradeHref,
  showChildrenWhenLocked = false,
}: Props) {
  const allowed = hasRequiredAccess(ent, requiredPlan);

  if (allowed) {
    return <>{children}</>;
  }

  const resolvedUpgradeHref = upgradeHref ?? `/checkout?plan=${requiredPlan}`;
  const currentPlan = currentPlanLabel(ent?.plan);

  return (
    <div className="lm-plan-gate-shell">
      <section className="lm-plan-gate-card card card-premium">
        <div className="lm-plan-gate-top">
          <div className="lm-plan-gate-badges">
            <span
              className={`lm-plan-gate-required badge ${
                requiredPlan === "plus" ? "pro" : ""
              }`.trim()}
            >
              {requiredPlan.toUpperCase()}
            </span>

            <span className="lm-plan-gate-current badge badge-ghost">
              Plano atual: {currentPlan}
            </span>
          </div>
        </div>

        <div className="lm-plan-gate-content">
          <h1 className="lm-plan-gate-title">{title}</h1>
          <p className="lm-plan-gate-copy">{description}</p>

          {bullets.length > 0 ? (
            <div className="lm-plan-gate-bullets">
              {bullets.map((item) => (
                <div key={item} className="lm-plan-gate-bullet">
                  {item}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="lm-plan-gate-actions">
          <Link href={resolvedUpgradeHref} className="btn btn-primary">
            Fazer upgrade
          </Link>

          <Link href={backHref} className="btn btn-ghost">
            Voltar
          </Link>
        </div>
      </section>

      {showChildrenWhenLocked ? (
        <div className="lm-plan-gate-preview">{children}</div>
      ) : null}
    </div>
  );
}
