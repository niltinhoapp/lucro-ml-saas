import Link from "next/link";
import { createServerClient } from "@/integrations/supabase/server";
import { getEntitlements } from "@/integrations/supabase/entitlements";
import {
  getPlanLabel,
  canAccess,
  type UserPlan,
} from "@/features/dashboard/shared/dashboard-data";
import LockedFeatureTrigger from "@/ui/LockedFeatureTrigger";
import {
  ArrowRight,
  Boxes,
  Crown,
  ShoppingBag,
  Wallet,
  Settings2,
  BellDot,
} from "lucide-react";

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

function HubCard({
  title,
  description,
  href,
  icon: Icon,
  allowed = true,
  plan,
  feature,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  allowed?: boolean;
  plan?: "pro" | "plus";
  feature?: string;
}) {
  const content = (
    <>
      <div className="dashboard-hub-card-icon">
        <Icon size={20} />
      </div>

      <div className="dashboard-hub-card-copy">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="dashboard-hub-card-cta">
        <span>{allowed ? "Abrir área" : "Desbloquear"}</span>
        <ArrowRight size={16} />
      </div>
    </>
  );

  if (!allowed && plan && feature) {
    return (
      <LockedFeatureTrigger
        className="dashboard-hub-card"
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
    <Link href={href} className="dashboard-hub-card">
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

  const hasProAccess = canAccess(currentPlan, "pro");
  const hasPlusAccess = canAccess(currentPlan, "plus");

  const strategyNotification =
    user && currentPlan === "plus"
      ? await getStrategyNotification(supabase, user.id, currentPlan)
      : null;

  return (
    <div className="page dashboard-hub">
      <section className="dashboard-hub-header">
        <div className="dashboard-hub-kicker">
          <Crown size={14} />
          <span>{getPlanLabel(currentPlan)}</span>
        </div>

        <h1>Escolha sua próxima decisão</h1>
        <p>
          Entre pela área certa da sua operação e avance com mais clareza, sem
          repetir navegação desnecessária.
        </p>
      </section>

      <section className="dashboard-hub-grid">
        <HubCard
          title="Produtos"
          description="Descubra oportunidades, leia catálogos e veja estratégias para vender melhor."
          href="/dashboard/produtos"
          icon={ShoppingBag}
          allowed={hasPlusAccess}
          plan="plus"
          feature="Produtos"
        />

        <HubCard
          title="Lucro"
          description="Valide margem, veja DRE, fluxo de caixa e compare Full vs Flex."
          href="/dashboard/lucro"
          icon={Wallet}
          allowed={hasProAccess}
          plan="pro"
          feature="Lucro"
        />

        <HubCard
          title="Operação"
          description="Simule compra, monte kits e use inteligência para decidir melhor."
          href="/dashboard/operacao"
          icon={Boxes}
          allowed={hasProAccess}
          plan="pro"
          feature="Operação"
        />

        <HubCard
          title="Conta"
          description="Veja integrações, ajuda e planos da sua conta em um só lugar."
          href="/dashboard/conta"
          icon={Settings2}
        />
      </section>

      {strategyNotification && (
        <section className="dashboard-hub-highlight">
          <div className="dashboard-hub-highlight-copy">
            <span className="dashboard-hub-highlight-badge">
              <BellDot size={14} />
              PLUS
            </span>

            <h2>{strategyNotification.title}</h2>
            <p>{strategyNotification.summary}</p>
          </div>

          <div className="dashboard-hub-highlight-side">
            <strong>
              {strategyNotification.unreadCount} nova
              {strategyNotification.unreadCount > 1 ? "s" : ""}
            </strong>

            <Link href="/dashboard/produtos/estrategias" className="btn btn-primary">
              Abrir estratégias
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}