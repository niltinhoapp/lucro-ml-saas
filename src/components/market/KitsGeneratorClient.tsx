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
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao gerar os kits."
      );
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
    <div className="lm-kits-page">
      <section className="lm-kits-hero">
        <div className="lm-kits-hero__content">
          <div className="lm-kits-hero__top">
            <div>
              <span className="lm-kits-chip">Gerador de kits</span>

              <h1 className="lm-kits-title">
                Monte ofertas mais fortes sem depender só de desconto
              </h1>

              <p className="lm-kits-subtitle">
                Escolha um produto base e receba formatos de kits para aumentar
                ticket médio, melhorar valor percebido e testar ofertas com mais
                clareza no Mercado Livre.
              </p>

              <div className="lm-kits-proof">
                <span>Mais valor percebido</span>
                <span>Ticket médio</span>
                <span>Margem estimada</span>
                <span>Ideias para teste</span>
              </div>
            </div>

            <div className="lm-kits-form-card">
              <div className="lm-kits-form-grid">
                <div className="lm-kits-field">
                  <label className="lm-kits-label">Produto base</label>
                  <input
                    className="lm-kits-input"
                    value={produto}
                    onChange={(e) => setProduto(e.target.value)}
                    placeholder="Ex.: escova secadora"
                  />
                </div>

                <div className="lm-kits-field">
                  <label className="lm-kits-label">Categoria</label>
                  <input
                    className="lm-kits-input"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    placeholder="Ex.: beleza"
                  />
                </div>

                <div className="lm-kits-field lm-kits-field--full">
                  <label className="lm-kits-label">Preço base</label>
                  <input
                    className="lm-kits-input"
                    value={precoBase}
                    onChange={(e) => setPrecoBase(e.target.value)}
                    placeholder="119.90"
                  />
                </div>
              </div>

              <button
                type="button"
                className="lm-kits-submit"
                onClick={gerar}
                disabled={loading}
              >
                {loading ? "Gerando kits..." : "Gerar kits"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <section className="lm-kits-error">
          <div className="lm-kits-error__kicker">Não foi possível concluir</div>
          <p>{error}</p>
        </section>
      ) : null}

      {data ? (
        <>
          <section className="lm-kits-summary-card">
            <div className="lm-kits-card-head">
              <div>
                <h2>Resumo das sugestões</h2>
                <p className="lm-kits-card-subtitle">
                  Veja formatos de oferta para fugir da guerra de preço e vender
                  com mais valor percebido.
                </p>
              </div>

              <span className="lm-kits-badge ok">{data.categoria}</span>
            </div>

            <div className="lm-kits-kpi-grid">
              <div className="lm-kits-kpi-card tone-good">
                <div className="lm-kits-kpi-label">Produto base</div>
                <div className="lm-kits-kpi-value">{data.produto}</div>
              </div>

              <div className="lm-kits-kpi-card tone-info">
                <div className="lm-kits-kpi-label">Categoria</div>
                <div className="lm-kits-kpi-value">{data.categoria}</div>
              </div>

              <div className="lm-kits-kpi-card">
                <div className="lm-kits-kpi-label">Kits sugeridos</div>
                <div className="lm-kits-kpi-value">{data.kits.length}</div>
              </div>
            </div>
          </section>

          <section className="lm-kits-grid">
            {data.kits.map((kit) => (
              <article key={kit.nome} className="lm-kits-item">
                <div className="lm-kits-card-head">
                  <div>
                    <span className="lm-kits-badge ok lm-kits-item__profile">
                      {kit.perfil}
                    </span>
                    <h3 className="lm-kits-item__title">{kit.nome}</h3>
                  </div>
                </div>

                <div className="lm-kits-item__price">
                  R$ {kit.precoSugerido.toFixed(2)}
                </div>

                <p className="lm-kits-item__margin">
                  Margem estimada: <strong>{kit.margemEstimada}</strong>
                </p>

                <div className="lm-kits-item__alert">{kit.motivo}</div>
              </article>
            ))}
          </section>

          <section className="lm-kits-bottom-grid">
            <div className="lm-kits-section-card">
              <div className="lm-kits-card-head">
                <div>
                  <h2>Como usar esses kits na prática</h2>
                  <p className="lm-kits-card-subtitle">
                    Próximos passos para transformar essas sugestões em ofertas
                    mais fortes.
                  </p>
                </div>
              </div>

              <div className="lm-kits-summary-list">
                {data.estrategia.map((item) => (
                  <div key={item} className="lm-kits-alert">
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