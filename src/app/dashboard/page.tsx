import Link from "next/link";
import { createServerClient } from "@/integrations/supabase/server";
import LockedFeatureTrigger from "@/ui/LockedFeatureTrigger";
import { getEntitlements } from "@/integrations/supabase/entitlements";
import {
  canAccess,
  getPlanLabel,
  type UserPlan,
} from "@/features/dashboard/shared/dashboard-data";
import { ArrowRight, BellDot, Crown, Radar, Wallet, Boxes } from "lucide-react";

type StrategyNotification = {
  title: string;
  summary: string;
  unreadCount: number;
};

async function getStrategyNotification(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
  currentPlan: UserPlan
): Promise<StrategyNotification | null> {
  if (currentPlan !== "plus") return null;

  const { data: strategies, error } = await supabase
    .from("strategies")
    .select("id, title, summary, access_level, published_at")
    .eq("access_level", "plus")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  if (error || !strategies?.length) return null;

  const strategyIds = strategies.map((item) => item.id);

  const { data: reads } = await supabase
    .from("user_strategy_reads")
    .select("strategy_id")
    .eq("user_id", userId)
    .in("strategy_id", strategyIds);

  const readIds = new Set((reads ?? []).map((item) => item.strategy_id));
  const unreadStrategies = strategies.filter((item) => !readIds.has(item.id));

  if (!unreadStrategies.length) return null;

  const firstUnread = unreadStrategies[0];

  return {
    title: firstUnread.title,
    summary: firstUnread.summary,
    unreadCount: unreadStrategies.length,
  };
}

function ActionCard({
  title,
  description,
  href,
  allowed,
  plan,
  feature,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  allowed: boolean;
  plan?: "pro" | "plus";
  feature: string;
  icon: React.ComponentType<{ size?: number }>;
}) {
  const content = (
    <>
      <div className="dashhome-compact-card-icon">
        <Icon size={18} />
      </div>

      <div className="dashhome-compact-card-copy">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <div className="dashhome-compact-card-cta">
        <span>{allowed ? "Abrir" : "Desbloquear"}</span>
        <ArrowRight size={15} />
      </div>
    </>
  );

  if (!allowed && plan) {
    return (
      <LockedFeatureTrigger
        className="dashhome-compact-card"
        plan={plan}
        feature={feature}
        title={`Desbloqueie ${feature}`}
        description={description}
      >
        {content}
      </LockedFeatureTrigger>
    );
  }

  return (
    <Link href={href} className="dashhome-compact-card">
      {content}
    </Link>
  );
}

export default async function DashboardPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentPlan: UserPlan = "preview";

  if (user) {
    const ent = await getEntitlements(supabase, user.id);

    if (
      ent.plan === "free_trial" ||
      ent.plan === "pro" ||
      ent.plan === "plus"
    ) {
      currentPlan = ent.plan;
    }
  }

  const strategyNotification =
    user && currentPlan === "plus"
      ? await getStrategyNotification(supabase, user.id, currentPlan)
      : null;

  const hasProAccess = canAccess(currentPlan, "pro");
  const hasPlusAccess = canAccess(currentPlan, "plus");

  return (
    <div className="page dashhome-compact">
      <section className="dashhome-compact-header">
        <div>
          <div className="dashhome-compact-kicker">
            <Crown size={14} />
            <span>{getPlanLabel(currentPlan)}</span>
          </div>

          <h1>Painel</h1>
          <p>
            Escolha o próximo passo da sua operação sem repetir o que já está no
            menu lateral.
          </p>
        </div>
      </section>

      <section className="dashhome-compact-actions">
        <ActionCard
          title="Radar ML"
          description="Encontre oportunidades antes de investir em estoque."
          href="/dashboard/produtos/radar"
          allowed={hasPlusAccess}
          plan="plus"
          feature="Radar ML"
          icon={Radar}
        />

        <ActionCard
          title="Diagnóstico"
          description="Valide margem e veja se o produto realmente sobra dinheiro."
          href="/dashboard/lucro/diagnostico"
          allowed={hasProAccess}
          plan="pro"
          feature="Diagnóstico de lucro"
          icon={Wallet}
        />

        <ActionCard
          title="Catálogos"
          description="Leia catálogos de fornecedor e destaque os itens com mais potencial."
          href="/dashboard/produtos/catalogos"
          allowed={hasPlusAccess}
          plan="plus"
          feature="Catálogos"
          icon={Boxes}
        />
      </section>

      {strategyNotification && (
        <section className="dashhome-compact-highlight">
          <div className="dashhome-compact-highlight-copy">
            <span className="dashhome-compact-highlight-badge">
              <BellDot size={14} />
              PLUS
            </span>

            <h2>{strategyNotification.title}</h2>
            <p>{strategyNotification.summary}</p>
          </div>

          <div className="dashhome-compact-highlight-side">
            <strong>
              {strategyNotification.unreadCount} nova
              {strategyNotification.unreadCount > 1 ? "s" : ""}
            </strong>

            <Link
              href="/dashboard/produtos/estrategias"
              className="btn btn-primary"
            >
              Abrir estratégias
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}