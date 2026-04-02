import Link from "next/link";
import { createServerClient } from "@/integrations/supabase/server";
import { getEntitlements } from "@/integrations/supabase/entitlements";
import {
  getPlanLabel,
  type UserPlan,
} from "@/features/dashboard/shared/dashboard-data";
import { BellDot, Crown, ArrowRight } from "lucide-react";

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

  return (
    <div className="page dashhome-focus">
      <section className="dashhome-focus-header">
        <div className="dashhome-focus-kicker">
          <Crown size={14} />
          <span>{getPlanLabel(currentPlan)}</span>
        </div>

        <h1>Painel</h1>
        <p>Veja o que merece sua atenção agora e siga para a próxima decisão.</p>
      </section>

      <section className="dashhome-focus-grid">
        <article className="dashhome-focus-card dashhome-focus-card-strong">
          <span className="dashhome-focus-label">Foco do momento</span>
          <h2>Valide margem antes de investir em novos produtos.</h2>
          <p>
            Use o menu lateral para abrir Radar, Lucro ou Catálogos conforme a
            etapa da sua operação.
          </p>

          <div className="dashhome-focus-inline">
            <Link href="/dashboard/lucro/diagnostico" className="btn btn-primary">
              Validar margem
            </Link>
          </div>
        </article>

        <article className="dashhome-focus-card">
          <span className="dashhome-focus-label">Plano atual</span>
          <h3>{getPlanLabel(currentPlan)}</h3>
          <p>
            O menu lateral organiza seus módulos por Produtos, Lucro, Operação e Conta.
          </p>
        </article>
      </section>

      {strategyNotification && (
        <section className="dashhome-focus-highlight">
          <div className="dashhome-focus-highlight-copy">
            <span className="dashhome-focus-badge">
              <BellDot size={14} />
              PLUS
            </span>

            <h2>{strategyNotification.title}</h2>
            <p>{strategyNotification.summary}</p>
          </div>

          <div className="dashhome-focus-highlight-side">
            <strong>
              {strategyNotification.unreadCount} nova
              {strategyNotification.unreadCount > 1 ? "s" : ""}
            </strong>

            <Link href="/dashboard/produtos/estrategias" className="btn btn-primary">
              Abrir estratégias
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}