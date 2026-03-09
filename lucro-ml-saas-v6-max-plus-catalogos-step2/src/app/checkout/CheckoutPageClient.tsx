"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SubscriptionPlan } from "@/lib/plans";

type PlanCard = {
  key: "pro" | "plus";
  badge: string;
  title: string;
  desc: string;
  price: string;
  sub: string;
  actionLabel: string;
  plan: SubscriptionPlan;
  featured?: boolean;
  items: string[];
};

const plans: PlanCard[] = [
  {
    key: "pro",
    badge: "PRO",
    title: "PRO",
    desc: "Operação diária com leitura rápida de lucro, margem e histórico.",
    price: "R$ 29,90",
    sub: "/mês",
    actionLabel: "Assinar PRO",
    plan: "pro_month",
    items: [
      "DRE completo com taxas, logística e lucro",
      "Histórico ilimitado",
      "Exportação em PDF",
      "Insights automáticos no dia a dia",
      "Full vs Flex com recomendação",
    ],
  },
  {
    key: "plus",
    badge: "PLUS • Avançado",
    title: "PLUS",
    desc: "Para decidir compra, lote e catálogo com leitura mais profunda.",
    price: "R$ 79,90",
    sub: "/mês",
    actionLabel: "Assinar PLUS",
    plan: "plus_month",
    featured: true,
    items: [
      "Tudo do PRO",
      "Análise de catálogo em PDF",
      "Tabela priorizada por oportunidade",
      "Leitura em lote para fornecedor",
      "Camada avançada de inteligência com baixo custo",
    ],
  },
];

export default function CheckoutPageClient({
  mpStatus,
}: {
  mpStatus?: string | null;
}) {
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const mpMessage = useMemo(() => {
    if (mpStatus === "success") {
      return {
        type: "success" as const,
        text: "Pagamento iniciado. Aguarde a confirmação da assinatura.",
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
        setErr("Mercado Pago não retornou o link de pagamento.");
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
    <div className="page-wrap checkout-page">
      <section className="topbar checkout-hero checkout-hero-clean">
        <div className="checkout-hero-text">
          <span className="badge pro">PLANOS SELLER</span>

          <h2 className="checkout-title">
            Escolha o nível certo para operar melhor hoje e comprar melhor amanhã
          </h2>

          <p className="subtitle checkout-subtitle">
            O PRO cuida da rotina de margem e histórico. O PLUS acrescenta análise
            de catálogo em PDF, leitura em lote e decisão de compra mais forte.
          </p>

          <div className="checkout-proof">
            <span className="pill good">PRO para operação</span>
            <span className="pill">PLUS para catálogo</span>
            <span className="pill">Mesma experiência visual</span>
          </div>

          <div className="checkout-hero-cta">
            <button className="btn btn-primary" type="button" onClick={() => assinar("plus_month")} disabled={Boolean(loadingPlan)}>
              {loadingPlan === "plus_month" ? "Abrindo checkout..." : "Assinar PLUS"}
            </button>

            <Link href="/dashboard" className="btn btn-ghost">
              Ver painel
            </Link>
          </div>
        </div>

        <div className="checkout-hero-preview card">
          <div className="checkout-preview-head">
            <span className="badge ok">Leitura rápida</span>
            <span className="small">Exemplo</span>
          </div>

          <div className="checkout-preview-kpis">
            <div className="checkout-preview-kpi">
              <span className="checkout-preview-label">Lucro estimado</span>
              <strong className="checkout-preview-value">R$ 42,10</strong>
            </div>

            <div className="checkout-preview-kpi">
              <span className="checkout-preview-label">Catálogo</span>
              <strong className="checkout-preview-value good">12 itens promissores</strong>
            </div>
          </div>

          <div className="checkout-preview-note">
            O PLUS transforma catálogo de fornecedor em tabela priorizada sem sair do fluxo do sistema.
          </div>
        </div>
      </section>

      <section className="checkout-grid" aria-label="Planos">
        {plans.map((item) => (
          <article key={item.key} className={`card checkout-plan ${item.featured ? "checkout-plan-pro" : ""}`}>
            <div className="checkout-plan-body">
              <div className="checkout-plan-head">
                <span className={`badge ${item.featured ? "pro" : ""}`.trim()}>{item.badge}</span>
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
              <button
                className="btn btn-primary btn-block"
                type="button"
                onClick={() => assinar(item.plan)}
                disabled={Boolean(loadingPlan)}
              >
                {loadingPlan === item.plan ? "Abrindo checkout..." : item.actionLabel}
              </button>

              <Link href="/dashboard" className="btn btn-ghost btn-block">
                Ver painel
              </Link>
            </div>
          </article>
        ))}

        <article className="card checkout-plan">
          <div className="checkout-plan-body">
            <div className="checkout-plan-head">
              <span className="badge">FREE</span>
              <h3 className="checkout-plan-title">Essencial</h3>
              <p className="checkout-plan-desc">
                Para testar o básico e acompanhar sua margem.
              </p>
            </div>

            <div className="checkout-price">
              <span className="checkout-price-main">R$ 0</span>
              <span className="checkout-price-sub">/mês</span>
            </div>

            <ul className="checkout-list">
              <li>Painel básico</li>
              <li>DRE simples</li>
              <li>Fluxo de caixa simples</li>
              <li>Full vs Flex limitado</li>
            </ul>
          </div>

          <div className="checkout-cta checkout-cta-single">
            <Link href="/dashboard" className="btn btn-ghost btn-block">
              Continuar no free
            </Link>
          </div>
        </article>
      </section>

      {err ? (
        <div className="alert danger checkout-note">{err}</div>
      ) : mpMessage ? (
        <div className={`alert ${mpMessage.type} checkout-note`}>{mpMessage.text}</div>
      ) : (
        <div className="alert info checkout-note">Você será redirecionado ao Mercado Pago.</div>
      )}

      <section className="card checkout-compare">
        <div className="checkout-compare-top">
          <h3 className="checkout-compare-title">Compare os planos</h3>
          <p className="checkout-compare-subtitle">
            O PLUS foi encaixado no projeto para expandir o que já existe, sem quebrar fluxo, design ou leitura.
          </p>
        </div>

        <div className="checkout-compare-table">
          <div className="checkout-compare-head">
            <div className="compare-col-feature">Recurso</div>
            <div className="compare-col-plan">Free</div>
            <div className="compare-col-plan compare-col-plan-pro">Pro</div>
            <div className="compare-col-plan compare-col-plan-pro">Plus</div>
          </div>

          <div className="compare-row">
            <div className="compare-feature">
              <span className="compare-feature-title">DRE completo</span>
              <span className="compare-feature-desc">Receita, taxas, logística e lucro</span>
            </div>
            <div className="compare-cell compare-cell-free">Básico</div>
            <div className="compare-cell compare-cell-pro">Completo</div>
            <div className="compare-cell compare-cell-pro">Completo</div>
          </div>

          <div className="compare-row">
            <div className="compare-feature">
              <span className="compare-feature-title">Exportação PDF</span>
              <span className="compare-feature-desc">Leve para sócio, operação e decisão</span>
            </div>
            <div className="compare-cell compare-cell-free">—</div>
            <div className="compare-cell compare-cell-pro">Incluso</div>
            <div className="compare-cell compare-cell-pro">Incluso</div>
          </div>

          <div className="compare-row">
            <div className="compare-feature">
              <span className="compare-feature-title">Análise de catálogo</span>
              <span className="compare-feature-desc">Leitura de PDF do fornecedor em tabela organizada</span>
            </div>
            <div className="compare-cell compare-cell-free">—</div>
            <div className="compare-cell compare-cell-free">Prévia futura</div>
            <div className="compare-cell compare-cell-pro">Incluso</div>
          </div>

          <div className="compare-row">
            <div className="compare-feature">
              <span className="compare-feature-title">Camada avançada de inteligência</span>
              <span className="compare-feature-desc">Leitura mais forte em lote e apoio para compra</span>
            </div>
            <div className="compare-cell compare-cell-free">—</div>
            <div className="compare-cell compare-cell-free">Base</div>
            <div className="compare-cell compare-cell-pro">Avançada</div>
          </div>
        </div>
      </section>
    </div>
  );
}
