"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createMarketAnalysis } from "@/lib/market/mock";
import ProUpgradeButton from "@/components/pro/ProUpgradeButton";

type Plan = "free" | "pro" | "plus";
type KpiTone = "good" | "warn" | "info";

export default function MarketIntelligenceClient({
  plan = "pro",
}: {
  plan?: Plan;
}) {
  const [query, setQuery] = useState("escova secadora profissional");
  const [draft, setDraft] = useState("escova secadora profissional");

  const analysis = useMemo(() => createMarketAnalysis(query), [query]);

  function atualizar() {
    const next = draft.trim();
    if (!next) return;
    setQuery(next);
  }

  const score = analysis.opportunityScore;
  const decisionLabel = getDecisionLabel(score);
  const decisionTone = getDecisionTone(score);

  return (
    <div className="lm-opintel-page">

      {/* HERO */}
      <section className="lm-opintel-hero">
        <div className="lm-opintel-hero__content">
          <div className="lm-opintel-hero__top">

            <div>
              <span className="lm-opintel-chip">Inteligência</span>

              <h1 className="lm-opintel-title">
                Decida antes de comprar
              </h1>

              <p className="lm-opintel-subtitle">
                Veja rapidamente se vale entrar, testar ou evitar.
              </p>
            </div>

            <div className="lm-opintel-search-card">
              <div className="lm-opintel-field">
                <label className="lm-opintel-label">Produto</label>

                <input
                  className="lm-opintel-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Ex: escova secadora"
                />
              </div>

              <button
                className="lm-opintel-submit"
                onClick={atualizar}
              >
                Atualizar leitura
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="lm-opintel-result-card">
        <div className="lm-opintel-card-head">
          <h2>Visão geral</h2>

          <span className={`lm-opintel-badge ${decisionTone}`}>
            {decisionLabel}
          </span>
        </div>

        <div className="lm-opintel-score-grid">

          <div className="lm-opintel-score-main">
            <div className="lm-opintel-score-label">Oportunidade</div>

            <div className="lm-opintel-score-value">
              {score}/100
            </div>

            <div className="lm-opintel-score-bar">
              <div
                className="lm-opintel-score-bar-fill"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          <div className="lm-opintel-kpi-grid">
            <KpiCard label="Preço médio" value={`R$ ${analysis.avgPrice.toFixed(2)}`} />

            <KpiCard
              label="Concorrência"
              value={`${analysis.activeAds}`}
              tone={analysis.activeAds > 120 ? "warn" : "info"}
            />

            <KpiCard
              label="Saturação"
              value={analysis.saturation}
              tone={analysis.saturation === "alta" ? "warn" : "good"}
            />

            <KpiCard
              label="Preço sugerido"
              value={`R$ ${analysis.priceSuggestion.toFixed(2)}`}
              tone="info"
            />
          </div>
        </div>
      </section>

      {/* DECISÃO */}
      <section className="lm-opintel-grid-2">

        <div className="lm-opintel-section-card">
          <div className="lm-opintel-card-head">
            <h2>Decisão sugerida</h2>
          </div>

          <div className="lm-opintel-summary-list">

            <div className="lm-opintel-alert success">
              {getDecisionText(score, analysis.saturation, analysis.priceSuggestion)}
            </div>

            <div className="lm-opintel-alert info">
              Faixa: R$ {analysis.minPrice.toFixed(2)} até R$ {analysis.maxPrice.toFixed(2)}
            </div>

            <div className="lm-opintel-alert info">
              Margem estimada: {analysis.estimatedMargin}%
            </div>

          </div>

          {/* AÇÕES */}
          <div className="lm-opintel-actions">

            <Link href="/dashboard/lucro/diagnostico" className="btn btn-dark">
              Diagnóstico
            </Link>

            <Link href="/dashboard/operacao/simulador" className="btn btn-ghost">
              Simular
            </Link>

            <Link href="/dashboard/produtos/catalogos" className="btn btn-ghost">
              Catálogos
            </Link>

          </div>
        </div>

        {/* TABELA */}
        <div className="lm-opintel-section-card">
          <div className="lm-opintel-card-head">
            <h2>Concorrência</h2>
          </div>

          <div className="lm-opintel-table-wrap">
            <table className="lm-opintel-table">
              <thead>
                <tr>
                  <th>Seller</th>
                  <th>Preço</th>
                  <th>Reputação</th>
                  <th>Vendas</th>
                  <th>Envio</th>
                </tr>
              </thead>

              <tbody>
                {analysis.competitions.map((item) => (
                  <tr key={`${item.seller}-${item.price}`}>
                    <td>{item.seller}</td>
                    <td>R$ {item.price.toFixed(2)}</td>
                    <td>{item.rating}</td>
                    <td>{item.sold}</td>
                    <td>{item.shipping.toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </section>

      {/* UPGRADE (APENAS FREE) */}
      {plan === "free" && (
        <section className="lm-opintel-grid-2">
          <ProUpgradeButton
            title="Quer decidir com lucro real?"
            subtitle="No PRO você combina mercado + DRE + simulador."
          />
        </section>
      )}

    </div>
  );
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: KpiTone;
}) {
  return (
    <div className={`lm-opintel-kpi-card ${tone ? `tone-${tone}` : ""}`}>
      <div className="lm-opintel-kpi-label">{label}</div>
      <div className="lm-opintel-kpi-value">{value}</div>
    </div>
  );
}

function getDecisionLabel(score: number) {
  if (score >= 80) return "Entrar";
  if (score >= 60) return "Testar";
  if (score >= 40) return "Cautela";
  return "Evitar";
}

function getDecisionTone(score: number) {
  if (score >= 80) return "ok";
  if (score >= 60) return "pro";
  if (score >= 40) return "warn";
  return "danger";
}

function getDecisionText(score: number, saturation: string, price: number) {
  if (score >= 80) {
    return `Boa oportunidade. Teste próximo de R$ ${price.toFixed(2)}.`;
  }

  if (score >= 60) {
    return `Viável, mas exige execução. Teste próximo de R$ ${price.toFixed(2)}.`;
  }

  if (score >= 40) {
    return `Cautela. Saturação ${saturation}. Precisa diferenciação.`;
  }

  return "Evitar. Mercado pressionado.";
}