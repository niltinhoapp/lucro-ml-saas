"use client";

import { useEffect, useState } from "react";

type Opportunity = {
  title: string;
  keyword: string;
  price: number;
  soldQuantity: number;
  competitionLevel: "baixa" | "média" | "alta";
  opportunityScore: number;
};

type RadarResponse = {
  ok: true;
  produto: string;
  market: {
    avgPrice: number;
    demandScore: number;
    competitionScore: number;
    opportunityScore: number;
  };
  opportunities: Opportunity[];
  sellers: {
    seller: string;
    items: number;
    share: number;
  }[];
};

function money(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v || 0);
}

export default function RadarOportunidades() {
  const [produto, setProduto] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RadarResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (!produto.trim()) {
      setError("Digite um produto");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/opportunity-radar", {
        method: "POST",
        body: JSON.stringify({ produto }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Erro ao consultar");
      }

      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const market = data?.market;
  const best = data?.opportunities?.[0];

  return (
    <div className="lm-radar">
      {/* HEADER */}
      <section className="lm-radar-hero">
        <div>
          <h1>Radar ML</h1>
          <p>Descubra oportunidades reais com base no mercado.</p>

          <form onSubmit={handleSearch} className="lm-radar-form">
            <input
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
              placeholder="Ex: suporte celular moto"
            />

            <button disabled={loading}>
              {loading ? "Analisando..." : "Analisar"}
            </button>
          </form>

          {error && <div className="lm-error">{error}</div>}
        </div>
      </section>

      {/* KPI */}
      <section className="lm-radar-kpis">
        <div>
          <span>Oportunidade</span>
          <strong>{market?.opportunityScore ?? "--"}</strong>
        </div>

        <div>
          <span>Preço médio</span>
          <strong>{market ? money(market.avgPrice) : "--"}</strong>
        </div>

        <div>
          <span>Demanda</span>
          <strong>{market?.demandScore ?? "--"}</strong>
        </div>

        <div>
          <span>Concorrência</span>
          <strong>{market?.competitionScore ?? "--"}</strong>
        </div>
      </section>

      {/* MELHOR */}
      <section className="lm-radar-best">
        <h2>Melhor oportunidade</h2>

        {best ? (
          <div className="lm-radar-best-card">
            <strong>{best.keyword}</strong>
            <p>{best.title}</p>

            <div className="lm-meta">
              <span>{money(best.price)}</span>
              <span>{best.soldQuantity} vendidos</span>
              <span>{best.competitionLevel}</span>
            </div>

            <div className="lm-score">{best.opportunityScore}/100</div>
          </div>
        ) : (
          <p>Faça uma busca</p>
        )}
      </section>

      {/* LISTA */}
      <section className="lm-radar-list">
        <h2>Oportunidades</h2>

        {data?.opportunities?.map((item) => (
          <div key={item.keyword} className="lm-radar-item">
            <div>
              <strong>{item.keyword}</strong>
              <p>{item.title}</p>
            </div>

            <div className="lm-meta">
              <span>{item.soldQuantity}</span>
              <span>{item.competitionLevel}</span>
            </div>

            <div className="lm-score">{item.opportunityScore}</div>
          </div>
        ))}
      </section>
    </div>
  );
}