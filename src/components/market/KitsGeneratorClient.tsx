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
  const [error, setError] = useState<string | null>(null);

  async function gerar() {
    setLoading(true);
    setError(null);

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

      if (!res.ok) {
        throw new Error("Não foi possível gerar sugestões de kits agora.");
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro ao gerar os kits.");
      setData(null);
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
            <span className="badge pro">Gerador de kits</span>

            <h1 className="exec-title">
              Monte ofertas mais fortes sem depender só de desconto
            </h1>

            <p className="exec-subtitle">
              Escolha um produto base e receba formatos de kits para aumentar
              ticket médio, melhorar valor percebido e testar ofertas com mais
              clareza no Mercado Livre.
            </p>

            <div className="exec-hero-proof">
              <span className="pill good">Mais valor percebido</span>
              <span className="pill">Ticket médio</span>
              <span className="pill">Margem estimada</span>
              <span className="pill">Ideias para teste</span>
            </div>
          </div>

          <div className="market-search-box seller-form-card exec-form-card">
            <div className="exec-form-grid">
              <div className="exec-field">
                <label className="market-label">Produto base</label>
                <input
                  className="market-input"
                  value={produto}
                  onChange={(e) => setProduto(e.target.value)}
                  placeholder="Ex.: escova secadora"
                />
              </div>

              <div className="exec-field">
                <label className="market-label">Categoria</label>
                <input
                  className="market-input"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Ex.: beleza"
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

      {error ? (
        <section className="card card-premium dre-error">
          <div className="dre-error-kicker">Não foi possível concluir</div>
          <p className="subtitle" style={{ marginTop: 10 }}>
            {error}
          </p>
        </section>
      ) : null}

      {data ? (
        <>
          <section className="diagnostic-score-card card card-premium">
            <div className="card-head">
              <div className="min-w-0">
                <h2>Resumo das sugestões</h2>
                <p className="subtitle">
                  Veja formatos de oferta para fugir da guerra de preço e vender com mais valor percebido.
                </p>
              </div>

              <span className="badge ok">{data.categoria}</span>
            </div>

            <div className="exec-kpi-grid diagnostic-kpis">
              <div className="exec-kpi-card tone-good">
                <div className="market-kpi-label">Produto base</div>
                <div className="exec-kpi-value">{data.produto}</div>
              </div>

              <div className="exec-kpi-card tone-info">
                <div className="market-kpi-label">Categoria</div>
                <div className="exec-kpi-value">{data.categoria}</div>
              </div>

              <div className="exec-kpi-card">
                <div className="market-kpi-label">Kits sugeridos</div>
                <div className="exec-kpi-value">{data.kits.length}</div>
              </div>
            </div>
          </section>

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
                  <h2>Como usar esses kits na prática</h2>
                  <p className="subtitle">
                    Próximos passos para transformar essas sugestões em ofertas mais fortes.
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
              subtitle="Use o PRO para salvar kits campeões, comparar versões e transformar boas ideias em rotina de venda."
            />
          </section>
        </>
      ) : null}
    </div>
  );
}



