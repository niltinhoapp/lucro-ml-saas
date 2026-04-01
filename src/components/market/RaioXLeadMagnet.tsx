"use client";

import { useMemo, useState } from "react";
import { createMarketAnalysis } from "@/lib/market/mock";

export default function RaioXLeadMagnet() {
  const [query, setQuery] = useState("escova secadora profissional");
  const analysis = useMemo(() => createMarketAnalysis(query), [query]);

  return (
    <div className="page">
      <section className="hero seller-home-hero">
        <div className="hero-inner">
          <div>
            <div className="hero-badge"><span className="dot" /> Raio-X grátis</div>
            <h1>Teste um produto antes de entrar pesado</h1>
            <p>Use o Raio-X grátis para gerar um score rápido e captar seller para a versão PRO.</p>
            <div className="market-search-row" style={{ marginTop: 18 }}>
              <input className="market-input" value={query} onChange={(e) => setQuery(e.target.value)} />
              <button className="btn btn-primary" type="button">Gerar</button>
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a className="btn" href="/auth/register">Criar conta</a>
              <a className="btn btn-ghost" href="/checkout">Assinar PRO</a>
            </div>
          </div>

          <div className="feature">
            <div className="t">Lead magnet com valor</div>
            <div className="d">Mostre score, preço médio, saturação e direcione para o PRO com clareza.</div>
          </div>
        </div>
      </section>

      <section className="market-grid-2">
        <div className="card card-premium market-share-card">
          <span className="badge pro">Card pronto</span>
          <h2>{analysis.query}</h2>
          <div className="market-share-score">{analysis.opportunityScore}/100</div>
          <div className="market-share-grid">
            <div><strong>Preço médio</strong><span>R$ {analysis.avgPrice.toFixed(2)}</span></div>
            <div><strong>Anúncios</strong><span>{analysis.activeAds}</span></div>
            <div><strong>Saturação</strong><span>{analysis.saturation}</span></div>
            <div><strong>Tendência</strong><span>{analysis.trend}</span></div>
          </div>
          <div className="alert success">Produto com leitura rápida gerada para seller decidir com mais contexto.</div>
        </div>

        <div className="card card-premium">
          <h2>O que o PRO libera</h2>
          <div className="market-summary-list">
            <div className="alert info">Detector de prejuízo oculto.</div>
            <div className="alert info">Kits lucrativos e histórico.</div>
            <div className="alert info">Simulador de estoque antes da compra.</div>
            <div className="alert success">Fluxo completo para decidir, vender e escalar.</div>
          </div>
          <div style={{ marginTop: 16 }}><a href="/checkout" className="btn btn-primary">Assinar PRO</a></div>
        </div>
      </section>
    </div>
  );
}

