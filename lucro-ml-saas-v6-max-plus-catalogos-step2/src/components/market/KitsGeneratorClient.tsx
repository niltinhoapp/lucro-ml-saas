"use client";

import { useEffect, useState } from "react";
import ProUpgradeButton from "@/components/pro/ProUpgradeButton";

type KitResponse = {
  produto: string;
  categoria: string;
  estrategia: string[];
  kits: Array<{
    nome: string;
    perfil: string;
    precoSugerido: number;
    margemEstimada: string;
    motivo: string;
  }>;
};

export default function KitsGeneratorClient() {
  const [produto, setProduto] = useState("escova secadora profissional");
  const [categoria, setCategoria] = useState("beleza");
  const [precoBase, setPrecoBase] = useState("119.9");
  const [data, setData] = useState<KitResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function gerar() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/kit-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produto,
          categoria,
          precoBase: Number(precoBase),
        }),
      });

      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    gerar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="market-page page-wrap">
      <section className="seller-hero seller-hero-kits exec-hero">
        <div className="exec-hero-top">
          <div className="exec-hero-copy">
            <span className="badge pro">IA de Kits</span>

            <h1 className="exec-title">
              Monte kits que aumentam ticket médio
            </h1>

            <p className="exec-subtitle">
              Em vez de disputar apenas por preço, crie combinações com valor
              percebido, margem mais saudável e mais chance de conversão.
            </p>
          </div>

          <div className="market-search-box seller-form-card exec-form-card">
            <div className="exec-form-grid">
              <div className="exec-field">
                <label className="market-label">Produto base</label>
                <input
                  className="market-input"
                  value={produto}
                  onChange={(e) => setProduto(e.target.value)}
                  placeholder="Ex: escova secadora"
                />
              </div>

              <div className="exec-field">
                <label className="market-label">Categoria</label>
                <input
                  className="market-input"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Ex: beleza"
                />
              </div>

              <div className="exec-field exec-field-full">
                <label className="market-label">Preço base</label>
                <input
                  className="market-input"
                  value={precoBase}
                  onChange={(e) => setPrecoBase(e.target.value)}
                  placeholder="119.90"
                />
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-big"
              onClick={gerar}
              disabled={loading}
            >
              {loading ? "Gerando kits..." : "Gerar kits"}
            </button>
          </div>
        </div>
      </section>

      {data ? (
        <>
          <section className="exec-section-grid seller-grid-tight">
            {data.kits.map((kit) => (
              <article
                key={kit.nome}
                className="card card-premium seller-insight-card exec-section-card"
              >
                <div className="card-head">
                  <div className="min-w-0">
                    <span className="badge ok">{kit.perfil}</span>
                    <h3 style={{ marginTop: 12 }}>{kit.nome}</h3>
                  </div>
                </div>

                <div className="seller-price-tag">
                  R$ {kit.precoSugerido.toFixed(2)}
                </div>

                <p className="muted" style={{ marginTop: 10 }}>
                  Margem estimada: <strong>{kit.margemEstimada}</strong>
                </p>

                <div className="alert success" style={{ marginTop: 14 }}>
                  {kit.motivo}
                </div>
              </article>
            ))}
          </section>

          <section className="market-grid-2">
            <div className="card card-premium exec-section-card">
              <div className="card-head">
                <div className="min-w-0">
                  <h2>Estratégia sugerida</h2>
                  <p className="subtitle">
                    Ações recomendadas para transformar os kits em oferta mais
                    forte no Mercado Livre.
                  </p>
                </div>
              </div>

              <div className="market-summary-list">
                {data.estrategia.map((item) => (
                  <div key={item} className="alert info">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <ProUpgradeButton
              title="Desbloqueie histórico de kits e comparação por margem"
              subtitle="Use o PRO para salvar kits campeões, comparar versões e transformar ideia boa em rotina de venda."
            />
          </section>
        </>
      ) : null}
    </div>
  );
}