"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SubscriptionPlan } from "@/lib/plans";

type PlanItem = {
  key: string;
  badge: string;
  title: string;
  desc: string;
  price: string;
  sub: string;
  items: string[];
  featured?: boolean;
  plan?: SubscriptionPlan;
  actionLabel: string;
  actionHref?: string;
};

const plans: PlanItem[] = [
  {
    key: "pro_month",
    badge: "PRO",
    title: "Seller PRO",
    desc: "Para o seller que quer usar as ferramentas principais do Lucro ML no dia a dia e tomar decisões com mais clareza.",
    price: "R$ 59,90",
    sub: "/mês",
    items: [
      "Diagnóstico de lucro",
      "Lucro real e DRE das vendas",
      "Simulador de compra de estoque",
      "Full vs Flex, inteligência de mercado e simulador de compra",
    ],
    plan: "pro_month",
    actionLabel: "Assinar PRO",
  },
  {
    key: "plus_month",
    badge: "PLUS",
    title: "Seller PLUS",
    desc: "Plano mais completo do Lucro ML, com análise de catálogos de fornecedores e recursos mais avançados para apoiar decisões de compra e operação.",
    price: "R$ 79,90",
    sub: "/mês",
    items: [
      "Tudo do PRO",
      "Análise de catálogos em PDF",
      "Radar ML e estratégias premium",
      "Recursos avançados para produtos e decisão",
    ],
    featured: true,
    plan: "plus_month",
    actionLabel: "Assinar PLUS",
  },
  {
    key: "plus_year",
    badge: "PLUS ANUAL",
    title: "PLUS Anual",
    desc: "Ideal para sellers em operação contínua que querem manter o acesso completo ao plano PLUS economizando no valor anual.",
    price: "R$ 799,90",
    sub: "/ano",
    items: [
      "PLUS completo por 12 meses",
      "Economia em relação ao plano mensal",
      "Mais previsibilidade para a operação",
    ],
    plan: "plus_year",
    actionLabel: "Assinar anual",
  },
  {
    key: "plus_lifetime",
    badge: "VITALÍCIO",
    title: "PLUS Vitalício",
    desc: "Condição especial para quem quer acesso permanente ao plano mais completo, com atendimento dedicado.",
    price: "R$ 5.279,70",
    sub: "pagamento único",
    items: [
      "Acesso permanente ao PLUS",
      "Maior economia no longo prazo",
      "Atendimento para contratação especial",
    ],
    actionLabel: "Solicitar vitalício",
    actionHref: "/dashboard/ajuda",
  },
];

export default function CheckoutPageClient({
  mpStatus,
}: {
  mpStatus?: string;
}) {
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const mpMessage = useMemo(() => {
    if (mpStatus === "success") {
      return {
        type: "success" as const,
        text: "Pagamento iniciado. Agora falta apenas a confirmação da assinatura.",
      };
    }

    if (mpStatus === "pending") {
      return {
        type: "info" as const,
        text: "Pagamento pendente de confirmação pelo Mercado Pago.",
      };
    }

    if (mpStatus === "failure") {
      return {
        type: "danger" as const,
        text: "O pagamento não foi concluído. Tente novamente.",
      };
    }

    return null;
  }, [mpStatus]);

  async function assinar(plan: SubscriptionPlan) {
    try {
      setErr(null);
      setLoadingPlan(plan);

      const res = await fetch("/api/mp/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/auth/login?next=/checkout";
          return;
        }

        setErr(json?.error ?? "Erro ao iniciar assinatura.");
        return;
      }

      if (!json?.init_point) {
        setErr("O Mercado Pago não retornou o link de pagamento.");
        return;
      }

      window.location.href = json.init_point;
    } catch {
      setErr("Falha ao conectar com o checkout.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="page-wrap checkout-page premium-checkout-page">
      <section className="topbar checkout-hero checkout-hero-clean premium-checkout-hero">
        <div className="checkout-hero-text">
          <span className="badge pro">PLANOS LUCRO ML</span>

          <h2 className="checkout-title">
            Escolha o plano certo para analisar melhor, comprar melhor e proteger sua margem
          </h2>

          <p className="subtitle checkout-subtitle">
            No Preview você conhece a estrutura da plataforma. No PRO, libera as ferramentas
            principais do dia a dia. No PLUS, desbloqueia o plano mais completo do Lucro ML,
            com radar ML, análise de catálogos e estratégias premium para apoiar suas decisões.
          </p>

          <div className="checkout-proof">
            <span className="pill good">Preview para conhecer a plataforma</span>
            <span className="pill">PRO mensal R$ 29,90</span>
            <span className="pill">PLUS mensal R$ 79,90</span>
            <span className="pill">PLUS anual R$ 799,90</span>
            <span className="pill">PLUS vitalício R$ 5.279,70</span>
          </div>
        </div>

        <div className="checkout-hero-preview card card-premium">
          <div className="checkout-preview-head">
            <span className="badge ok">Destaque</span>
            <span className="small">PLUS</span>
          </div>

          <div className="checkout-preview-kpis">
            <div className="checkout-preview-kpi">
              <span className="checkout-preview-label">Catálogos de fornecedor</span>
              <strong className="checkout-preview-value">PDF → produtos com potencial</strong>
            </div>

            <div className="checkout-preview-kpi">
              <span className="checkout-preview-label">Mais apoio na decisão</span>
              <strong className="checkout-preview-value good">
                Mais clareza para decidir compra
              </strong>
            </div>
          </div>

          <div className="checkout-preview-note">
            O PLUS foi pensado para o seller que quer usar os módulos premium de produto,
            encontrar oportunidades com mais velocidade e decidir melhor a compra.
          </div>
        </div>
      </section>

      <section className="checkout-grid" aria-label="Planos">
        {plans.map((item) => (
          <article
            key={item.key}
            className={`card checkout-plan ${item.featured ? "checkout-plan-pro" : ""}`}
          >
            <div className="checkout-plan-body">
              <div className="checkout-plan-head">
                <span className={`badge ${item.featured ? "pro" : ""}`.trim()}>
                  {item.badge}
                </span>
                <h3 className="checkout-plan-title">{item.title}</h3>
                <p className="checkout-plan-desc">{item.desc}</p>
              </div>

              <div className="checkout-price">
                <span className="checkout-price-main">{item.price}</span>
                <span className="checkout-price-sub">{item.sub}</span>
              </div>

              <ul className={`checkout-list ${item.featured ? "checkout-list-strong" : ""}`}>
                {item.items.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>

            <div className="checkout-cta checkout-cta-stack">
              {item.plan ? (
                <button
                  className="btn btn-primary btn-block"
                  type="button"
                  onClick={() => assinar(item.plan!)}
                  disabled={Boolean(loadingPlan)}
                >
                  {loadingPlan === item.plan ? "Abrindo checkout..." : item.actionLabel}
                </button>
              ) : (
                <Link href={item.actionHref ?? "/dashboard/ajuda"} className="btn btn-primary btn-block">
                  {item.actionLabel}
                </Link>
              )}

              <Link href="/dashboard" className="btn btn-ghost btn-block">
                Ver painel
              </Link>
            </div>
          </article>
        ))}

        <article className="card checkout-plan">
          <div className="checkout-plan-body">
            <div className="checkout-plan-head">
              <span className="badge">PREVIEW</span>
              <h3 className="checkout-plan-title">Exploração gratuita</h3>
              <p className="checkout-plan-desc">
                Conheça a estrutura da plataforma, veja os módulos disponíveis e entenda
                como o Lucro ML pode ajudar na sua operação.
              </p>
            </div>

            <div className="checkout-price">
              <span className="checkout-price-main">R$ 0</span>
              <span className="checkout-price-sub">para conhecer</span>
            </div>

            <ul className="checkout-list">
              <li>Explorar a estrutura completa do sistema</li>
              <li>Entender o valor de cada módulo</li>
              <li>Acessar ajuda e suporte</li>
            </ul>
          </div>

          <div className="checkout-cta checkout-cta-single">
            <Link href="/dashboard" className="btn btn-ghost btn-block">
              Continuar no preview
            </Link>
          </div>
        </article>
      </section>

      {err ? (
        <div className="alert danger checkout-note">{err}</div>
      ) : mpMessage ? (
        <div className={`alert ${mpMessage.type} checkout-note`}>{mpMessage.text}</div>
      ) : (
        <div className="alert info checkout-note">
          As assinaturas mensais e anuais podem ser feitas direto pelo checkout.
          O plano vitalício é tratado por atendimento para alinhar a contratação.
        </div>
      )}

      <section className="card checkout-compare card-premium">
        <div className="checkout-compare-top">
          <h3 className="checkout-compare-title">Compare os planos</h3>
          <p className="checkout-compare-subtitle">
            Entenda qual nível faz mais sentido para a fase atual da sua operação.
          </p>
        </div>

        <div className="checkout-compare-table">
          <div className="checkout-compare-head">
            <div className="compare-col-feature">Recurso</div>
            <div className="compare-col-plan">Preview</div>
            <div className="compare-col-plan compare-col-plan-pro">PRO</div>
            <div className="compare-col-plan compare-col-plan-pro">PLUS</div>
          </div>

          <div className="compare-row">
            <div className="compare-feature">
              <span className="compare-feature-title">Acesso à plataforma</span>
              <span className="compare-feature-desc">Conhecer interface e módulos</span>
            </div>
            <div className="compare-cell compare-cell-pro">Sim</div>
            <div className="compare-cell compare-cell-pro">Sim</div>
            <div className="compare-cell compare-cell-pro">Sim</div>
          </div>

          <div className="compare-row">
            <div className="compare-feature">
              <span className="compare-feature-title">Uso das ferramentas principais</span>
              <span className="compare-feature-desc">Análises, relatórios e leitura da operação</span>
            </div>
            <div className="compare-cell compare-cell-free">Bloqueado</div>
            <div className="compare-cell compare-cell-pro">Liberado</div>
            <div className="compare-cell compare-cell-pro">Liberado</div>
          </div>

          <div className="compare-row">
            <div className="compare-feature">
              <span className="compare-feature-title">Análise de catálogos</span>
              <span className="compare-feature-desc">Leitura de PDF do fornecedor</span>
            </div>
            <div className="compare-cell compare-cell-free">Prévia</div>
            <div className="compare-cell compare-cell-free">Bloqueado</div>
            <div className="compare-cell compare-cell-pro">Incluso</div>
          </div>

          <div className="compare-row">
            <div className="compare-feature">
              <span className="compare-feature-title">Recursos mais avançados</span>
              <span className="compare-feature-desc">Plano superior do Lucro ML</span>
            </div>
            <div className="compare-cell compare-cell-free">—</div>
            <div className="compare-cell compare-cell-free">—</div>
            <div className="compare-cell compare-cell-pro">Incluso</div>
          </div>
        </div>
      </section>
    </div>
  );
}

