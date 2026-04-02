"use client";

import { useMemo, useState } from "react";
import { createMarketAnalysis } from "@/lib/market/mock";
import ProUpgradeButton from "@/components/pro/ProUpgradeButton";

type KpiTone = "good" | "warn" | "info";

export default function MarketIntelligenceClient() {
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

  return (
    <div className="lm-opintel-page">
      <section className="lm-opintel-hero">
        <div className="lm-opintel-hero__content">
          <div className="lm-opintel-hero__top">
            <div>
              <span className="lm-opintel-chip">Inteligência de mercado</span>

              <h1 className="lm-opintel-title">
                Veja se esse produto ainda tem espaço para entrada
              </h1>

              <p className="lm-opintel-subtitle">
                Digite um produto e receba uma leitura rápida de preço,
                concorrência, saturação e potencial antes de decidir se vale
                comprar, testar ou ajustar sua estratégia no Mercado Livre.
              </p>

              <div className="lm-opintel-proof">
                <span>Preço médio</span>
                <span>Concorrência</span>
                <span>Saturação</span>
                <span>Preço sugerido</span>
              </div>
            </div>

            <div className="lm-opintel-search-card">
              <div className="lm-opintel-field">
                <label htmlFor="query" className="lm-opintel-label">
                  Produto
                </label>

                <input
                  id="query"
                  className="lm-opintel-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Ex.: escova secadora profissional"
                />
              </div>

              <button
                type="button"
                className="lm-opintel-submit"
                onClick={atualizar}
              >
                Atualizar leitura
              </button>

              <div className="lm-opintel-note">
                Primeiro entenda o cenário. Depois decida se vale entrar, testar
                ou ajustar preço e posicionamento.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lm-opintel-result-card">
        <div className="lm-opintel-card-head">
          <div>
            <h2>Resumo do cenário</h2>
            <p className="lm-opintel-card-subtitle">
              Veja rapidamente se esse nicho parece promissor, disputado ou mais
              arriscado para entrada.
            </p>
          </div>

          <span className="lm-opintel-badge ok">{analysis.category}</span>
        </div>

        <div className="lm-opintel-score-grid">
          <div className="lm-opintel-score-main">
            <div className="lm-opintel-score-label">
              Pontuação de oportunidade
            </div>
            <div className="lm-opintel-score-value">
              {analysis.opportunityScore}/100
            </div>

            <div className="lm-opintel-score-bar">
              <div
                className="lm-opintel-score-bar-fill"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, analysis.opportunityScore)
                  )}%`,
                }}
              />
            </div>

            <p className="lm-opintel-score-text">
              Essa leitura considera concorrência ativa, faixa de preço,
              saturação e potencial de margem para ajudar você a decidir com
              mais clareza.
            </p>
          </div>

          <div className="lm-opintel-kpi-grid">
            <KpiCard
              label="Preço médio"
              value={`R$ ${analysis.avgPrice.toFixed(2)}`}
            />

            <KpiCard
              label="Anúncios ativos"
              value={String(analysis.activeAds)}
            />

            <KpiCard
              label="Margem alvo"
              value={`${analysis.estimatedMargin}%`}
              tone="good"
            />

            <KpiCard
              label="Saturação"
              value={analysis.saturation}
              tone={analysis.saturation === "alta" ? "warn" : "good"}
            />

            <KpiCard label="Tendência" value={analysis.trend} tone="info" />

            <KpiCard
              label="Preço sugerido"
              value={`R$ ${analysis.priceSuggestion.toFixed(2)}`}
              tone="info"
            />
          </div>
        </div>
      </section>

      <section className="lm-opintel-grid-2">
        <div className="lm-opintel-section-card">
          <div className="lm-opintel-card-head">
            <div>
              <h2>Leitura para decisão</h2>
              <p className="lm-opintel-card-subtitle">
                Use esse resumo para decidir se vale entrar, testar ou deixar
                esse nicho em observação.
              </p>
            </div>

            <span className="lm-opintel-badge ok">{analysis.category}</span>
          </div>

          <div className="lm-opintel-summary-list">
            {analysis.summary.map((item) => (
              <div className="lm-opintel-alert info" key={item}>
                {item}
              </div>
            ))}

            <div className="lm-opintel-alert success">
              Preço sugerido para teste: R${" "}
              {analysis.priceSuggestion.toFixed(2)}
            </div>
          </div>

          <div className="lm-opintel-price-band">
            <div className="lm-opintel-subcard">
              <strong>Faixa de preço observada</strong>
              <div>
                R$ {analysis.minPrice.toFixed(2)} até R${" "}
                {analysis.maxPrice.toFixed(2)}
              </div>
            </div>

            <div className="lm-opintel-subcard">
              <strong>Preço sugerido para entrada</strong>
              <div>R$ {analysis.priceSuggestion.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="lm-opintel-section-card">
          <div className="lm-opintel-card-head">
            <div>
              <h2>Concorrência observada</h2>
              <p className="lm-opintel-card-subtitle">
                Veja preço, reputação, volume e logística dos sellers que já
                estão disputando esse mercado.
              </p>
            </div>

            <span className="lm-opintel-badge pro">Radar seller</span>
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

      <section className="lm-opintel-grid-2">
        <div className="lm-opintel-section-card">
          <div className="lm-opintel-card-head">
            <div>
              <h2>Como agir com essa leitura</h2>
              <p className="lm-opintel-card-subtitle">
                Transforme essa análise em uma decisão prática para sua
                operação.
              </p>
            </div>
          </div>

          <div className="lm-opintel-summary-list">
            <div className="lm-opintel-alert success">
              Teste o produto com preço próximo de R${" "}
              {analysis.priceSuggestion.toFixed(2)} para validar aceitação sem
              pressionar demais a margem.
            </div>

            <div className="lm-opintel-alert info">
              Se a saturação estiver alta, sua diferenciação precisa aparecer no
              kit, na oferta ou no posicionamento percebido.
            </div>

            <div className="lm-opintel-alert info">
              Nichos com margem alvo saudável costumam dar mais segurança para
              testar sem travar tanto o caixa.
            </div>
          </div>
        </div>

        <ProUpgradeButton
          title="Quer cruzar mercado com lucro real e decisão de compra?"
          subtitle="No PRO você combina leitura de mercado com DRE, catálogos e simulador para decidir melhor onde vale entrar."
        />
      </section>
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