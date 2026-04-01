import Link from "next/link";
import { createServerClient } from "@/integrations/supabase/server";
import LockedFeatureTrigger from "@/ui/LockedFeatureTrigger";
import { getEntitlements } from "@/integrations/supabase/entitlements";
import {
  canAccess,
  dashboardIconMap,
  getPlanLabel,
  getUpgradeHref,
  moduleCards,
  quickActions,
  shouldShowBadge,
  type UserPlan,
} from "@/features/dashboard/shared/dashboard-data";
import {
  ArrowRight,
  Crown,
  Sparkles,
  ShieldCheck,
  Radar,
  Wallet,
  Boxes,
  BellDot,
  BarChart3,
  Gem,
  TrendingUp,
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

  const { data: strategies, error: strategiesError } = await supabase
    .from("strategies")
    .select("id, title, summary, access_level, published_at")
    .eq("access_level", "plus")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  if (strategiesError || !strategies?.length) return null;

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

function getQuickIcon(title: string) {
  if (title.toLowerCase().includes("radar")) return Radar;
  if (title.toLowerCase().includes("lucro")) return Wallet;
  return Boxes;
}

function getLockedCopy(feature: string, plan: "pro" | "plus") {
  const map: Record<string, { title: string; description: string }> = {
    "Radar ML": {
      title: "Desbloqueie o Radar ML",
      description:
        "Descubra produtos com boa procura e menor concorrência antes de investir em estoque.",
    },
    "Catálogos de fornecedor": {
      title: "Desbloqueie Catálogos de fornecedor",
      description:
        "Leia catálogos com mais clareza e encontre produtos com potencial para anúncio.",
    },
    "Estratégias ML": {
      title: "Desbloqueie Estratégias ML",
      description:
        "Acesse estratégias premium para vender melhor no Mercado Livre com mais visão.",
    },
    "Diagnóstico de lucro": {
      title: "Desbloqueie o Diagnóstico de lucro",
      description:
        "Veja rapidamente onde sua operação perde margem e tome decisões com mais segurança.",
    },
    "Lucro real e DRE": {
      title: "Desbloqueie Lucro real e DRE",
      description:
        "Organize taxas, custos e resultado final do negócio com mais clareza financeira.",
    },
    "Fluxo de caixa": {
      title: "Desbloqueie o Fluxo de caixa",
      description:
        "Acompanhe entradas, saídas e fôlego financeiro para operar melhor.",
    },
    "Full vs Flex": {
      title: "Desbloqueie Full vs Flex",
      description:
        "Compare cenários logísticos e entenda qual caminho faz mais sentido para sua operação.",
    },
    "Simulador de compra": {
      title: "Desbloqueie o Simulador de compra",
      description:
        "Avalie risco, retorno e capital antes de investir em estoque.",
    },
    "Gerador de kits": {
      title: "Desbloqueie o Gerador de kits",
      description:
        "Monte combinações inteligentes para elevar ticket médio e melhorar giro.",
    },
    "Inteligência de mercado": {
      title: "Desbloqueie Inteligência de mercado",
      description:
        "Receba apoio para decidir o que priorizar e agir com mais visão.",
    },
    "Integrações ML": {
      title: "Desbloqueie Integrações ML",
      description:
        "Conecte sua conta do Mercado Livre e amplie o potencial da plataforma.",
    },
    "Ver Plus": {
      title: "Conheça o plano Plus",
      description:
        "O Plus adiciona Radar ML, catálogos de fornecedor e estratégias premium.",
    },
    "Ver Pro": {
      title: "Conheça o plano Pro",
      description:
        "O Pro libera lucro, DRE, fluxo de caixa, simulador e inteligência de mercado.",
    },
    "Desbloquear lucro": {
      title: "Desbloqueie o módulo de lucro",
      description:
        "Proteja sua margem com diagnóstico, DRE, fluxo de caixa e comparações logísticas.",
    },
  };

  return (
    map[feature] ?? {
      title: `Desbloqueie ${feature}`,
      description: `Este recurso exige o plano ${plan.toUpperCase()} para liberar mais poder no seu dashboard.`,
    }
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
      ent.plan === "plus" ||
      ent.plan === "pro"
    ) {
      currentPlan = ent.plan;
    }
  }

  const strategyNotification =
    user && currentPlan === "plus"
      ? await getStrategyNotification(supabase, user.id, currentPlan)
      : null;

  const hasPlusAccess = canAccess(currentPlan, "plus");
  const hasProAccess = canAccess(currentPlan, "pro");

  return (
    <div className="page dashhome-premium">
      <section className="dashhome-premium-hero">
        <div className="dashhome-premium-glow dashhome-premium-glow-1" />
        <div className="dashhome-premium-glow dashhome-premium-glow-2" />
        <div className="dashhome-premium-gridline" />

        <div className="dashhome-premium-hero-copy">
          <div className="dashhome-premium-kicker-row">
            <span className="dashhome-premium-plan">
              <Crown size={14} />
              <span>{getPlanLabel(currentPlan)}</span>
            </span>

            <span className="dashhome-premium-kicker">
              <Sparkles size={14} />
              <span>Centro de controle do seller</span>
            </span>
          </div>

          <h1 className="dashhome-premium-title">
            Descubra oportunidades, proteja sua margem e organize sua operação.
          </h1>

          <p className="dashhome-premium-subtitle">
            Use o Lucro ML como seu centro de decisão no Mercado Livre.
            Encontre produtos, valide lucro antes de comprar e acompanhe sua
            operação sem perder tempo.
          </p>

          <div className="dashhome-premium-proof">
            <span>
              <Radar size={14} />
              Radar para encontrar produto
            </span>
            <span>
              <ShieldCheck size={14} />
              Lucro para proteger margem
            </span>
            <span>
              <Boxes size={14} />
              Operação para decidir melhor
            </span>
          </div>

          <div className="dashhome-premium-hero-actions">
            {hasPlusAccess ? (
              <Link
                href="/dashboard/produtos/radar"
                className="btn btn-primary dashhome-premium-btn-main"
              >
                Abrir Radar ML
                <ArrowRight size={16} />
              </Link>
            ) : (
              <LockedFeatureTrigger
                className="btn btn-primary dashhome-premium-btn-main"
                plan="plus"
                feature="Radar ML"
                title="Desbloqueie o Radar ML"
                description="Descubra produtos com boa procura e menor concorrência antes de investir."
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  Abrir Radar ML
                  <ArrowRight size={16} />
                </span>
              </LockedFeatureTrigger>
            )}

            <Link
              href="/checkout"
              className="btn btn-ghost dashhome-premium-btn-secondary"
            >
              Ver planos
            </Link>
          </div>

          <div className="dashhome-premium-stats">
            <div className="dashhome-premium-stat">
              <span className="dashhome-premium-stat-label">Fluxo ideal</span>
              <strong>Radar → Lucro → Compra</strong>
            </div>

            <div className="dashhome-premium-stat">
              <span className="dashhome-premium-stat-label">Foco do dia</span>
              <strong>Tomar decisão com segurança</strong>
            </div>

            <div className="dashhome-premium-stat">
              <span className="dashhome-premium-stat-label">Plano</span>
              <strong>{getPlanLabel(currentPlan)}</strong>
            </div>
          </div>
        </div>

        <div className="dashhome-premium-hero-side">
          <div className="dashhome-premium-side-card dashhome-premium-side-card-strong">
            <div className="dashhome-premium-side-top">
              <span className="dashhome-premium-side-label">Plano atual</span>
              <span className="dashhome-premium-side-chip">
                <Gem size={13} />
                Premium
              </span>
            </div>

            <strong className="dashhome-premium-side-title">
              {currentPlan === "plus"
                ? "Você está no plano mais completo"
                : `Plano ${getPlanLabel(currentPlan)}`}
            </strong>

            <p>
              O Plus libera Radar ML, catálogos de fornecedor e estratégias premium.
            </p>

            <div className="dashhome-premium-side-mini-grid">
              <div>
                <span>Módulos</span>
                <strong>Produtos + Lucro</strong>
              </div>
              <div>
                <span>Objetivo</span>
                <strong>Decidir melhor</strong>
              </div>
            </div>
          </div>

          <div className="dashhome-premium-side-card">
            <span className="dashhome-premium-side-label">Próximo passo</span>
            <strong className="dashhome-premium-side-title">
              Comece pelo Radar e valide sua margem antes de investir.
            </strong>
          </div>
        </div>
      </section>

      <section className="dashhome-premium-section">
        <div className="dashhome-premium-section-head">
          <div>
            <h2>Ações rápidas</h2>
            <p>Comece pelo Radar, valide lucro e só depois avance para a compra.</p>
          </div>
        </div>

        <div className="dashhome-premium-quick-grid">
          {quickActions.map((item) => {
            const allowed = canAccess(currentPlan, item.requiredPlan);
            const href = allowed ? item.href : getUpgradeHref(item.requiredPlan);
            const showBadge = shouldShowBadge(currentPlan, item.requiredPlan);
            const Icon = getQuickIcon(item.title);

            const cardContent = (
              <>
                <div className="dashhome-premium-quick-icon">
                  <Icon size={20} />
                </div>

                <div className="dashhome-premium-card-top">
                  <h3>{item.title}</h3>

                  {showBadge ? (
                    <span
                      className={`badge ${
                        item.requiredPlan === "plus" ? "pro" : ""
                      }`.trim()}
                    >
                      {item.requiredPlan?.toUpperCase()}
                    </span>
                  ) : item.highlight ? (
                    <span className="pill good">Principal</span>
                  ) : null}
                </div>

                <p>{item.description}</p>

                <div className="dashhome-premium-quick-meta">
                  <span>Uso rápido</span>
                  <span>{allowed ? "Disponível" : "Recurso bloqueado"}</span>
                </div>

                <div className="dashhome-premium-card-cta">
                  <span>{allowed ? "Abrir" : "Desbloquear"}</span>
                  <ArrowRight size={15} />
                </div>
              </>
            );

            if (!allowed && item.requiredPlan) {
              const locked = getLockedCopy(item.title, item.requiredPlan);

              return (
                <LockedFeatureTrigger
                  key={item.href}
                  className="dashhome-premium-quick-card"
                  plan={item.requiredPlan}
                  feature={item.title}
                  title={locked.title}
                  description={locked.description}
                >
                  {cardContent}
                </LockedFeatureTrigger>
              );
            }

            return (
              <Link
                key={item.href}
                href={href}
                className="dashhome-premium-quick-card"
              >
                {cardContent}
              </Link>
            );
          })}
        </div>
      </section>

      {strategyNotification && (
        <section className="dashhome-premium-highlight">
          <div className="dashhome-premium-highlight-copy">
            <span className="dashhome-premium-highlight-badge">
              <BellDot size={14} />
              PLUS
            </span>

            <h2>Nova estratégia disponível</h2>
            <h3>{strategyNotification.title}</h3>
            <p>{strategyNotification.summary}</p>

            <div className="dashhome-premium-proof">
              <span>
                <Sparkles size={14} />
                {strategyNotification.unreadCount} não lida
                {strategyNotification.unreadCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div className="dashhome-premium-highlight-actions">
            <Link href="/dashboard/produtos/estrategias" className="btn btn-primary">
              Abrir estratégias
            </Link>
          </div>
        </section>
      )}

      <section className="dashhome-premium-section">
        <div className="dashhome-premium-section-head">
          <div>
            <h2>Módulos do sistema</h2>
            <p>
              Cada módulo agrupa as ferramentas certas para uma etapa do seu negócio.
            </p>
          </div>
        </div>

        <div className="dashhome-premium-modules-grid">
          {moduleCards.map((module) => {
            const Icon = dashboardIconMap[module.icon];

            return (
              <article key={module.title} className="dashhome-premium-module-card">
                <div className="dashhome-premium-card-top">
                  <h3 className="dashhome-premium-module-title">
                    <span className="dashhome-premium-module-icon">
                      <Icon size={18} />
                    </span>
                    <span>{module.title}</span>
                  </h3>

                  <Link href={module.href} className="dashhome-premium-module-link">
                    Ver módulo
                  </Link>
                </div>

                <p className="dashhome-premium-module-desc">{module.summary}</p>

                <div className="dashhome-premium-module-strip">
                  <TrendingUp size={14} />
                  <span>Ferramentas organizadas por etapa do negócio</span>
                </div>

                <div className="dashhome-premium-module-items">
                  {module.items.map((item) => {
                    const allowed = canAccess(currentPlan, item.requiredPlan);
                    const href = allowed ? item.href : getUpgradeHref(item.requiredPlan);
                    const showBadge = shouldShowBadge(currentPlan, item.requiredPlan);

                    const itemCard = (
                      <>
                        <div className="dashhome-premium-module-item-copy">
                          <strong>{item.label}</strong>
                          <span>{item.description}</span>
                        </div>

                        <div className="dashhome-premium-module-item-side">
                          {showBadge && (
                            <span
                              className={`badge ${
                                item.requiredPlan === "plus" ? "pro" : ""
                              }`.trim()}
                            >
                              {item.requiredPlan?.toUpperCase()}
                            </span>
                          )}
                          <ArrowRight size={14} />
                        </div>
                      </>
                    );

                    if (!allowed && item.requiredPlan) {
                      const locked = getLockedCopy(item.label, item.requiredPlan);

                      return (
                        <LockedFeatureTrigger
                          key={item.href}
                          className="dashhome-premium-module-item"
                          plan={item.requiredPlan}
                          feature={item.label}
                          title={locked.title}
                          description={locked.description}
                        >
                          {itemCard}
                        </LockedFeatureTrigger>
                      );
                    }

                    return (
                      <Link
                        key={item.href}
                        href={href}
                        className="dashhome-premium-module-item"
                      >
                        {itemCard}
                      </Link>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="dashhome-premium-bottom">
        <div className="dashhome-premium-bottom-card">
          <span className="dashhome-premium-side-label">Por onde começar</span>
          <h3>
            Comece pelo Radar para descobrir produto. Depois valide sua margem no
            módulo de lucro.
          </h3>

          <div className="dashhome-premium-bottom-points">
            <span>
              <Radar size={14} /> Descobrir produto
            </span>
            <span>
              <Wallet size={14} /> Validar lucro
            </span>
            <span>
              <BarChart3 size={14} /> Decidir com clareza
            </span>
          </div>

          <div className="dashhome-premium-bottom-actions">
            {hasPlusAccess ? (
              <Link href="/dashboard/produtos/radar" className="btn btn-primary">
                Ir para o Radar
              </Link>
            ) : (
              <LockedFeatureTrigger
                className="btn btn-primary"
                plan="plus"
                feature="Radar ML"
                title="Desbloqueie o Radar ML"
                description="Descubra produtos com boa procura e menor concorrência antes de investir."
              >
                <span>Ir para o Radar</span>
              </LockedFeatureTrigger>
            )}

            {hasProAccess ? (
              <Link href="/dashboard/lucro/dre" className="btn btn-ghost">
                Ver lucro real
              </Link>
            ) : (
              <LockedFeatureTrigger
                className="btn btn-ghost"
                plan="pro"
                feature="Desbloquear lucro"
                title="Desbloqueie o módulo de lucro"
                description="Organize taxas, custos e resultado final da operação com mais clareza."
              >
                <span>Desbloquear lucro</span>
              </LockedFeatureTrigger>
            )}
          </div>
        </div>

        <div className="dashhome-premium-bottom-card dashhome-premium-bottom-card-plus">
          <span className="dashhome-premium-side-label">Plano</span>
          <h3>
            {currentPlan === "plus"
              ? "Você está no plano mais completo"
              : "Desbloqueie mais recursos"}
          </h3>
          <p>
            O Pro cobre lucro e operação. O Plus adiciona Radar ML, catálogos e
            estratégias premium.
          </p>

          <div className="dashhome-premium-bottom-actions">
            {currentPlan !== "plus" && (
              <LockedFeatureTrigger
                className="btn btn-primary"
                plan="plus"
                feature="Ver Plus"
                title="Conheça o plano Plus"
                description="Desbloqueie Radar ML, catálogos de fornecedor e estratégias premium."
              >
                <span>Ver Plus</span>
              </LockedFeatureTrigger>
            )}

            {(currentPlan === "free_trial" || currentPlan === "preview") && (
              <LockedFeatureTrigger
                className="btn btn-ghost"
                plan="pro"
                feature="Ver Pro"
                title="Conheça o plano Pro"
                description="Desbloqueie lucro, DRE, fluxo de caixa e ferramentas operacionais."
              >
                <span>Ver Pro</span>
              </LockedFeatureTrigger>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

