"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createMarketAnalysis } from "@/lib/market/mock";
import ProUpgradeButton from "@/components/pro/ProUpgradeButton";

type KpiTone = "good" | "warn" | "info";
type Plan = "free" | "pro" | "plus";

type MarketIntelligenceClientProps = {
  plan?: Plan;
};

export default function MarketIntelligenceClient({
  plan = "pro",
}: MarketIntelligenceClientProps) {
  const [query, setQuery] = useState("escova secadora profissional");
  const [draft, setDraft] = useState("escova secadora profissional");

  const analysis = useMemo(() => {
    return createMarketAnalysis(query);
  }, [query]);

  function atualizar() {
    const next = draft.trim();
    if (!next) return;
    setQuery(next);
  }

  const decisionLabel = getDecisionLabel(analysis.opportunityScore);
  const decisionTone = getDecisionTone(analysis.opportunityScore);
  const decisionText = getDecisionText({
    score: analysis.opportunityScore,
    saturation: analysis.saturation,
    priceSuggestion: analysis.priceSuggestion,
  });

  return (
    <div className="market-page page-wrap">
      <section className="seller-hero seller-hero-market exec-hero">
        <div className="exec-hero-top">
          <div className="exec-hero-copy">
            <span className="badge pro">Inteligência</span>

            <h1 className="exec-title">Leitura rápida de mercado</h1>

            <p className="exec-subtitle">
              Digite um produto e veja se vale entrar, testar com cautela ou
              apenas observar.
            </p>
          </div>

          <div className="market-search-box seller-form-card exec-form-card">
            <div className="exec-field exec-field-full">
              <label htmlFor="query" className="market-label">
                Produto
              </label>

              <input
                id="query"
                className="market-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ex.: escova secadora profissional"
              />
            </div>

            <button
              type="button"
              className="btn btn-primary btn-big"
              onClick={atualizar}
            >
              Atualizar leitura
            </button>
          </div>
        </div>
      </section>

      <section className="diagnostic-score-card card card-premium">
        <div className="card-head">
          <div className="min-w-0">
            <h2>Visão geral</h2>
            <p className="subtitle">
              Os sinais principais para decidir entrada.
            </p>
          </div>

          <span className={`badge ${decisionTone}`}>{decisionLabel}</span>
        </div>

        <div className="diagnostic-score-grid">
          <div className="diagnostic-score-main tone-good">
            <div className="diagnostic-score-label">Oportunidade</div>

            <div className="diagnostic-score-value">
              {analysis.opportunityScore}/100
            </div>

            <div className="diagnostic-score-bar">
              <div
                className="diagnostic-score-bar-fill tone-good"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, analysis.opportunityScore)
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="exec-kpi-grid diagnostic-kpis">
            <KpiCard
              label="Preço médio"
              value={`R$ ${analysis.avgPrice.toFixed(2)}`}
            />

            <KpiCard
              label="Concorrência"
              value={`${analysis.activeAds} anúncios`}
              tone={analysis.activeAds > 120 ? "warn" : "info"}
            />

            <KpiCard
              label="Saturação"
              value={capitalize(analysis.saturation)}
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

      <section className="market-grid-2">
        <div className="card card-premium exec-section-card">
          <div className="card-head">
            <div className="min-w-0">
              <h2>Decisão sugerida</h2>
              <p className="subtitle">
                Direção prática com base na leitura atual.
              </p>
            </div>

            <span className={`badge ${decisionTone}`}>{analysis.category}</span>
          </div>

          <div className="market-summary-list">
            <div className="alert success">{decisionText}</div>

            <div className="alert info">
              Faixa observada: R$ {analysis.minPrice.toFixed(2)} até R${" "}
              {analysis.maxPrice.toFixed(2)}.
            </div>

            <div className="alert info">
              Margem alvo estimada: {analysis.estimatedMargin}% com custo,
              frete e taxa sob controle.
            </div>

            <div className="alert info">
              Tendência atual: {capitalize(analysis.trend)}.
            </div>
          </div>

          <div className="market-price-band">
            <div className="ui-subcard">
              <strong>Preço sugerido</strong>
              <div style={{ marginTop: 8 }}>
                R$ {analysis.priceSuggestion.toFixed(2)}
              </div>
            </div>

            <div className="ui-subcard">
              <strong>Ação recomendada</strong>
              <div style={{ marginTop: 8 }}>{decisionLabel}</div>
            </div>
          </div>

          <div
            className="market-price-band"
            style={{ marginTop: 16, gridTemplateColumns: "repeat(3, 1fr)" }}
          >
            <Link href="/dashboard/lucro/diagnostico" className="btn btn-dark">
              Abrir diagnóstico
            </Link>

            <Link
              href="/dashboard/operacao/simulador"
              className="btn btn-ghost"
            >
              Abrir simulador
            </Link>

            <Link
              href="/dashboard/produtos/catalogos"
              className="btn btn-ghost"
            >
              Ver catálogos
            </Link>
          </div>
        </div>

        <div className="card card-premium exec-section-card">
          <div className="card-head">
            <div className="min-w-0">
              <h2>Concorrência observada</h2>
              <p className="subtitle">
                Preço, reputação, volume e logística dos sellers já ativos.
              </p>
            </div>

            <span className="badge pro">Radar seller</span>
          </div>

          <div className="market-table-wrap">
            <table className="market-table">
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

      {plan === "free" && (
        <section className="market-grid-2">
          <ProUpgradeButton
            title="Quer cruzar mercado com lucro real e decisão de compra?"
            subtitle="No PRO você combina leitura de mercado com DRE, catálogos e simulador para decidir melhor onde vale entrar."
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
    <div className={`exec-kpi-card ${tone ? `tone-${tone}` : ""}`}>
      <div className="market-kpi-label">{label}</div>
      <div className="exec-kpi-value">{value}</div>
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

function getDecisionText({
  score,
  saturation,
  priceSuggestion,
}: {
  score: number;
  saturation: string;
  priceSuggestion: number;
}) {
  if (score >= 80) {
    return `Boa oportunidade de entrada. Teste próximo de R$ ${priceSuggestion.toFixed(
      2
    )} e foque em execução forte.`;
  }

  if (score >= 60) {
    return `Mercado viável, mas exige diferenciação. Teste próximo de R$ ${priceSuggestion.toFixed(
      2
    )} com controle de margem.`;
  }

  if (score >= 40) {
    return `Entrada com cautela. A saturação está ${saturation} e o produto precisa de oferta bem ajustada para performar.`;
  }

  return "Mercado mais apertado neste momento. Melhor observar ou buscar alternativa com menos pressão competitiva.";
}

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}