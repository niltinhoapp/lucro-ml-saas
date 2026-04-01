"use client";

import { useEffect, useState } from "react";

type Opportunity = {
  title: string;
  keyword: string;
  price: number;
  soldQuantity: number;
  competitionLevel: "baixa" | "média" | "alta";
  opportunityScore: number;
  shipping: string;
  permalink?: string;
};

type RadarResponse = {
  ok: true;
  traceId?: string;
  produto: string;
  market: {
    activeListings: number;
    uniqueSellers: number;
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
    powerSeller: string;
  }[];
};

type RadarErrorResponse = {
  ok?: false;
  error?: string;
  detail?: string;
  traceId?: string;
};

type RankingItem = {
  keyword: string;
  bestScore: number;
  seenCount: number;
};

type FavoriteItem = {
  id: string;
  keyword: string;
  opportunity_score: number;
};

type HistoryItem = {
  id: string;
  query: string;
  opportunity_score: number;
};

type HistoryResponse = {
  items?: HistoryItem[];
};

type RankingResponse = {
  items?: RankingItem[];
};

type FavoritesResponse = {
  items?: FavoriteItem[];
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function recommendation(score: number) {
  if (score >= 75) {
    return { text: "Boa oportunidade para explorar.", color: "success" };
  }

  if (score >= 55) {
    return {
      text: "Oportunidade moderada. Avalie diferenciação.",
      color: "info",
    };
  }

  return { text: "Nicho competitivo. Cuidado ao entrar.", color: "warn" };
}

function buildRadarErrorMessage(
  payload: RadarErrorResponse | null,
  status: number
) {
  const base =
    payload?.error ||
    (status === 401
      ? "Faça login para usar o radar."
      : status === 403
      ? "Sua conta não pôde ser validada para usar o Radar ML."
      : "Não foi possível consultar o Mercado Livre agora.");

  return [
    base,
    payload?.detail ? `Detalhe: ${payload.detail}` : null,
    payload?.traceId ? `Trace: ${payload.traceId}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
}

export default function RadarOportunidades() {
  const [produto, setProduto] = useState("suporte celular moto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RadarResponse | null>(null);

  const [tab, setTab] = useState<
    "keywords" | "ranking" | "favorites" | "history" | "sellers"
  >("keywords");

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  const market = data?.market ?? null;
  const bestOpportunity = data?.opportunities?.[0] ?? null;

  async function loadPanels() {
    try {
      const [historyRes, rankingRes, favoritesRes] = await Promise.all([
        fetch("/api/ai/opportunity-radar/history", { cache: "no-store" }),
        fetch("/api/ai/opportunity-radar/ranking", { cache: "no-store" }),
        fetch("/api/ai/opportunity-radar/favorites", { cache: "no-store" }),
      ]);

      const historyJson = (await historyRes.json().catch(() => ({}))) as HistoryResponse;
      const rankingJson = (await rankingRes.json().catch(() => ({}))) as RankingResponse;
      const favoritesJson = (await favoritesRes.json().catch(() => ({}))) as FavoritesResponse;

      setHistory(historyJson.items ?? []);
      setRanking(rankingJson.items ?? []);
      setFavorites(favoritesJson.items ?? []);
    } catch (err) {
      console.error("[Radar ML] falha ao carregar painéis laterais:", err);
    }
  }

  useEffect(() => {
    loadPanels();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const termo = produto.trim();

    if (!termo) {
      setError("Informe um produto para consultar.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/opportunity-radar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ produto: termo }),
      });

      const json = (await res.json().catch(() => null)) as
        | RadarResponse
        | RadarErrorResponse
        | null;

      console.log("[Radar ML] status:", res.status);
      console.log("[Radar ML] resposta:", json);

      if (!res.ok) {
        throw new Error(
          buildRadarErrorMessage(json as RadarErrorResponse | null, res.status)
        );
      }

      setData(json as RadarResponse);
      await loadPanels();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível consultar o Mercado Livre agora.";

      setError(message);
      console.error("[Radar ML] erro ao consultar:", err);
    } finally {
      setLoading(false);
    }
  }

  const rec = recommendation(market?.opportunityScore ?? 0);

  return (
    <div className="page-wrap" style={{ display: "grid", gap: 20 }}>
      <section className="card card-premium">
        <h1>Radar de oportunidades</h1>

        <p className="subtitle">
          Descubra produtos com boa procura e menor concorrência.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", gap: 10, marginTop: 12 }}
        >
          <input
            value={produto}
            onChange={(e) => setProduto(e.target.value)}
            placeholder="Ex: suporte celular moto"
          />

          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Consultando..." : "Consultar radar"}
          </button>
        </form>

        {error && (
          <div
            className="alert error"
            style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          >
            {error}
          </div>
        )}
      </section>

      <section className="card card-premium">
        <h2>Resumo do mercado</h2>

        <div className="exec-kpi-grid">
          <div className="exec-kpi-card">
            <div className="market-kpi-label">Vale a pena vender?</div>
            <div className="exec-kpi-value">
              {market?.opportunityScore ?? "--"}/100
            </div>
          </div>

          <div className="exec-kpi-card">
            <div className="market-kpi-label">Preço médio</div>
            <div className="exec-kpi-value">
              {market ? formatMoney(market.avgPrice) : "--"}
            </div>
          </div>

          <div className="exec-kpi-card">
            <div className="market-kpi-label">Procura pelo produto</div>
            <div className="exec-kpi-value">{market?.demandScore ?? "--"}</div>
          </div>

          <div className="exec-kpi-card">
            <div className="market-kpi-label">Concorrência</div>
            <div className="exec-kpi-value">
              {market?.competitionScore ?? "--"}
            </div>
          </div>
        </div>

        {market && (
          <div className={`alert ${rec.color}`} style={{ marginTop: 14 }}>
            {rec.text}
          </div>
        )}
      </section>

      <section className="card card-premium">
        <h2>Melhor oportunidade encontrada</h2>

        {bestOpportunity ? (
          <div>
            <strong>{bestOpportunity.keyword}</strong>

            <p>{bestOpportunity.title}</p>

            <p>Preço médio: {formatMoney(bestOpportunity.price)}</p>

            <p>Vendidos: {bestOpportunity.soldQuantity}</p>

            <p>Concorrência: {bestOpportunity.competitionLevel}</p>
          </div>
        ) : (
          <div className="alert info">
            Faça uma busca para encontrar oportunidades.
          </div>
        )}
      </section>

      <section className="card card-premium">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setTab("keywords")} className="btn btn-ghost">
            Keywords
          </button>

          <button onClick={() => setTab("ranking")} className="btn btn-ghost">
            Ranking
          </button>

          <button onClick={() => setTab("favorites")} className="btn btn-ghost">
            Favoritos
          </button>

          <button onClick={() => setTab("history")} className="btn btn-ghost">
            Histórico
          </button>

          <button onClick={() => setTab("sellers")} className="btn btn-ghost">
            Sellers
          </button>
        </div>
      </section>

      {tab === "keywords" && (
        <section className="card card-premium">
          <h2>Keywords para explorar</h2>

          {(data?.opportunities ?? []).map((item) => (
            <div key={item.keyword} className="market-trend-item">
              <strong>{item.keyword}</strong>

              <div className="muted">
                {item.competitionLevel} concorrência • vendidos {item.soldQuantity}
              </div>

              <span className="badge pro">{item.opportunityScore}/100</span>
            </div>
          ))}
        </section>
      )}

      {tab === "ranking" && (
        <section className="card card-premium">
          <h2>Ranking da semana</h2>

          <table className="market-table">
            <tbody>
              {ranking.map((item) => (
                <tr key={item.keyword}>
                  <td>{item.keyword}</td>
                  <td>{item.bestScore}/100</td>
                  <td>{item.seenCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === "favorites" && (
        <section className="card card-premium">
          <h2>Favoritos</h2>

          {favorites.map((item) => (
            <div key={item.id}>
              <strong>{item.keyword}</strong> • {item.opportunity_score}/100
            </div>
          ))}
        </section>
      )}

      {tab === "history" && (
        <section className="card card-premium">
          <h2>Histórico de buscas</h2>

          {history.map((item) => (
            <div key={item.id}>
              {item.query} • score {item.opportunity_score}
            </div>
          ))}
        </section>
      )}

      {tab === "sellers" && (
        <section className="card card-premium">
          <h2>Sellers dominando o nicho</h2>

          <table className="market-table">
            <tbody>
              {(data?.sellers ?? []).map((item) => (
                <tr key={item.seller}>
                  <td>{item.seller}</td>
                  <td>{item.items}</td>
                  <td>{item.share}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

