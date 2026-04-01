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
    <div className="market-page page-wrap">
      <section className="seller-hero seller-hero-market exec-hero">
        <div className="exec-hero-top">
          <div className="exec-hero-copy">
            <span className="badge pro">Inteligência de mercado</span>

            <h1 className="exec-title">
              Veja se esse produto ainda tem espaço para entrada
            </h1>

            <p className="exec-subtitle">
              Digite um produto e receba uma leitura rápida de preço, concorrência,
              saturação e potencial antes de decidir se vale comprar, testar ou ajustar
              sua estratégia no Mercado Livre.
            </p>

            <div className="exec-hero-proof">
              <span className="pill good">Preço médio</span>
              <span className="pill">Concorrência</span>
              <span className="pill">Saturação</span>
              <span className="pill">Preço sugerido</span>
            </div>
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

            <div className="alert info">
              Primeiro entenda o cenário. Depois decida se vale entrar, testar
              ou ajustar preço e posicionamento.
            </div>
          </div>
        </div>
      </section>

      <section className="diagnostic-score-card card card-premium">
        <div className="card-head">
          <div className="min-w-0">
            <h2>Resumo do cenário</h2>
            <p className="subtitle">
              Veja rapidamente se esse nicho parece promissor, disputado ou mais arriscado para entrada.
            </p>
          </div>

          <span className="badge ok">{analysis.category}</span>
        </div>

        <div className="diagnostic-score-grid">
          <div className="diagnostic-score-main tone-good">
            <div className="diagnostic-score-label">Pontuação de oportunidade</div>
            <div className="diagnostic-score-value">
              {analysis.opportunityScore}/100
            </div>

            <div className="diagnostic-score-bar">
              <div
                className="diagnostic-score-bar-fill tone-good"
                style={{
                  width: `${Math.max(0, Math.min(100, analysis.opportunityScore))}%`,
                }}
              />
            </div>

            <p className="diagnostic-score-text">
              Essa leitura considera concorrência ativa, faixa de preço,
              saturação e potencial de margem para ajudar você a decidir com mais clareza.
            </p>
          </div>

          <div className="exec-kpi-grid diagnostic-kpis">
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

            <KpiCard
              label="Tendência"
              value={analysis.trend}
              tone="info"
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
              <h2>Leitura para decisão</h2>
              <p className="subtitle">
                Use esse resumo para decidir se vale entrar, testar ou deixar esse nicho em observação.
              </p>
            </div>

            <span className="badge ok">{analysis.category}</span>
          </div>

          <div className="market-summary-list">
            {analysis.summary.map((item) => (
              <div className="alert info" key={item}>
                {item}
              </div>
            ))}

            <div className="alert success">
              Preço sugerido para teste: R$ {analysis.priceSuggestion.toFixed(2)}
            </div>
          </div>

          <div className="market-price-band">
            <div className="ui-subcard">
              <strong>Faixa de preço observada</strong>
              <div style={{ marginTop: 8 }}>
                R$ {analysis.minPrice.toFixed(2)} até R$ {analysis.maxPrice.toFixed(2)}
              </div>
            </div>

            <div className="ui-subcard">
              <strong>Preço sugerido para entrada</strong>
              <div style={{ marginTop: 8 }}>
                R$ {analysis.priceSuggestion.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="card card-premium exec-section-card">
          <div className="card-head">
            <div className="min-w-0">
              <h2>Concorrência observada</h2>
              <p className="subtitle">
                Veja preço, reputação, volume e logística dos sellers que já estão disputando esse mercado.
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

      <section className="market-grid-2">
        <div className="card card-premium exec-section-card">
          <div className="card-head">
            <div className="min-w-0">
              <h2>Como agir com essa leitura</h2>
              <p className="subtitle">
                Transforme essa análise em uma decisão prática para sua operação.
              </p>
            </div>
          </div>

          <div className="market-summary-list">
            <div className="alert success">
              Teste o produto com preço próximo de R$ {analysis.priceSuggestion.toFixed(2)}
              para validar aceitação sem pressionar demais a margem.
            </div>

            <div className="alert info">
              Se a saturação estiver alta, sua diferenciação precisa aparecer no kit,
              na oferta ou no posicionamento percebido.
            </div>

            <div className="alert info">
              Nichos com margem alvo saudável costumam dar mais segurança para testar
              sem travar tanto o caixa.
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
    <div className={`exec-kpi-card ${tone ? `tone-${tone}` : ""}`}>
      <div className="market-kpi-label">{label}</div>
      <div className="exec-kpi-value">{value}</div>
    </div>
  );
}




