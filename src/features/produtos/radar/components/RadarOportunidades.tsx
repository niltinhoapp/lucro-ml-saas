"use client";

import { useEffect, useMemo, useState } from "react";
import { Brain, ChevronRight, Loader2, Search, Sparkles, Target, TrendingUp, Users } from "lucide-react";

type Opportunity = {
  title: string;
  keyword: string;
  price: number;
  soldQuantity: number;
  competitionLevel: "baixa" | "média" | "alta";
  opportunityScore: number;
  sellerShare?: number;
  shipping?: string;
  permalink?: string;
};

type SellerItem = {
  seller: string;
  items: number;
  share: number;
  powerSeller: string;
};

type RadarResponse = {
  ok: true;
  traceId?: string;
  produto: string;
  market: {
    activeListings: number;
    uniqueSellers: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    avgSoldQuantity: number;
    freeShippingRate: number;
    catalogRate: number;
    topSellerShare: number;
    demandScore: number;
    competitionScore: number;
    opportunityScore: number;
  };
  highlights: string[];
  aiRecommendation: {
    title: string;
    reason: string;
    score: number;
    strategySlug: string | null;
    strategyId: string | null;
  } | null;
  opportunities: Opportunity[];
  sellers: SellerItem[];
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

type RadarTab = "keywords" | "ranking" | "favorites" | "history" | "sellers";

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
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

function getRecommendationTone(score: number) {
  if (score >= 90) {
    return {
      label: "Recomendação forte",
      className: "is-strong",
    };
  }

  if (score >= 80) {
    return {
      label: "Boa recomendação",
      className: "is-good",
    };
  }

  return {
    label: "Sugestão útil",
    className: "is-neutral",
  };
}

function getOpportunityTone(score: number) {
  if (score >= 75) {
    return {
      text: "Boa oportunidade para explorar.",
      className: "is-positive",
    };
  }

  if (score >= 55) {
    return {
      text: "Oportunidade moderada. Avalie diferenciação.",
      className: "is-warning",
    };
  }

  return {
    text: "Nicho competitivo. Cuidado ao entrar.",
    className: "is-critical",
  };
}

export default function RadarOportunidades() {
  const [produto, setProduto] = useState("suporte celular moto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RadarResponse | null>(null);
  const [tab, setTab] = useState<RadarTab>("keywords");

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  const market = data?.market ?? null;
  const bestOpportunity = data?.opportunities?.[0] ?? null;
  const aiSuggestion = data?.aiRecommendation ?? null;
  const tone = getOpportunityTone(market?.opportunityScore ?? 0);
  const suggestionTone = getRecommendationTone(aiSuggestion?.score ?? 0);

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
    } catch (loadError) {
      console.error("[Radar ML] falha ao carregar painéis laterais:", loadError);
    }
  }

  useEffect(() => {
    loadPanels();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const termo = produto.trim();

    if (!termo) {
      setError("Informe um produto para consultar.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/opportunity-radar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ produto: termo }),
      });

      const json = (await response.json().catch(() => null)) as
        | RadarResponse
        | RadarErrorResponse
        | null;

      if (!response.ok) {
        throw new Error(
          buildRadarErrorMessage(json as RadarErrorResponse | null, response.status)
        );
      }

      setData(json as RadarResponse);
      await loadPanels();
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível consultar o Mercado Livre agora.";

      setError(message);
      console.error("[Radar ML] erro ao consultar:", requestError);
    } finally {
      setLoading(false);
    }
  }

  const tabButtons = useMemo(
    () => [
      { id: "keywords" as const, label: "Keywords" },
      { id: "ranking" as const, label: "Ranking" },
      { id: "favorites" as const, label: "Favoritos" },
      { id: "history" as const, label: "Histórico" },
      { id: "sellers" as const, label: "Sellers" },
    ],
    []
  );

  return (
    <div className="lm-radar-page">
      <section className="lm-radar-hero">
        <div className="lm-radar-hero__content">
          <div className="lm-radar-chip">
            <Sparkles size={16} />
            <span>Radar ML • Inteligência de mercado</span>
          </div>

          <div className="lm-radar-hero__header">
            <div>
              <h1 className="lm-radar-title">Radar de oportunidades</h1>
              <p className="lm-radar-subtitle">
                Descubra produtos com melhor equilíbrio entre demanda,
                concorrência e potencial de margem no Mercado Livre.
              </p>
            </div>

            <div className="lm-radar-hero__side">
              <div className="lm-radar-mini-stat">
                <TrendingUp size={18} />
                <div>
                  <strong>
                    {market ? `${market.opportunityScore}/100` : "Sem análise"}
                  </strong>
                  <span>Potencial atual</span>
                </div>
              </div>

              <div className="lm-radar-mini-stat">
                <Users size={18} />
                <div>
                  <strong>
                    {market ? `${market.uniqueSellers} sellers` : "--"}
                  </strong>
                  <span>Base competitiva</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="lm-radar-form">
            <div className="lm-radar-form__field">
              <Search size={18} />
              <input
                value={produto}
                onChange={(event) => setProduto(event.target.value)}
                placeholder="Ex: suporte celular moto"
                aria-label="Produto para analisar no radar"
              />
            </div>

            <button
              type="submit"
              className="lm-radar-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="lm-spin" />
                  <span>Analisando...</span>
                </>
              ) : (
                <>
                  <Target size={16} />
                  <span>Consultar radar</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="lm-radar-alert is-error">
              <strong>Falha ao consultar</strong>
              <p>{error}</p>
            </div>
          )}
        </div>
      </section>

      <section className="lm-radar-kpi-grid">
        <article className="lm-radar-kpi-card">
          <span>Oportunidade</span>
          <strong>{market?.opportunityScore ?? "--"}</strong>
        </article>

        <article className="lm-radar-kpi-card">
          <span>Preço médio</span>
          <strong>{market ? formatMoney(market.avgPrice) : "--"}</strong>
        </article>

        <article className="lm-radar-kpi-card">
          <span>Demanda</span>
          <strong>{market?.demandScore ?? "--"}</strong>
        </article>

        <article className="lm-radar-kpi-card">
          <span>Concorrência</span>
          <strong>{market?.competitionScore ?? "--"}</strong>
        </article>
      </section>

      {market && (
        <section className={`lm-radar-alert ${tone.className}`}>
          <strong>Leitura do nicho</strong>
          <p>{tone.text}</p>
        </section>
      )}

      {aiSuggestion && (
        <section className={`lm-radar-ai-box ${suggestionTone.className}`}>
          <div className="lm-radar-ai-box__top">
            <div className="lm-radar-ai-box__chip">
              <Brain size={16} />
              <span>{suggestionTone.label}</span>
            </div>

            <span className="lm-radar-ai-box__score">
              Score {aiSuggestion.score}
            </span>
          </div>

          <strong>{aiSuggestion.title}</strong>
          <p>{aiSuggestion.reason}</p>
        </section>
      )}

      <section className="lm-radar-layout">
        <div className="lm-radar-main">
          <article className="lm-radar-panel">
            <div className="lm-radar-panel__header">
              <h2>Melhor oportunidade encontrada</h2>
            </div>

            {bestOpportunity ? (
              <div className="lm-radar-best-card">
                <div className="lm-radar-best-card__top">
                  <div>
                    <strong>{bestOpportunity.keyword}</strong>
                    <p>{bestOpportunity.title}</p>
                  </div>

                  <span className="lm-radar-score-pill">
                    {bestOpportunity.opportunityScore}/100
                  </span>
                </div>

                <div className="lm-radar-meta-row">
                  <span>{formatMoney(bestOpportunity.price)}</span>
                  <span>{bestOpportunity.soldQuantity} vendidos</span>
                  <span>{bestOpportunity.competitionLevel} concorrência</span>
                  {bestOpportunity.shipping && (
                    <span>{bestOpportunity.shipping}</span>
                  )}
                </div>

                {bestOpportunity.permalink ? (
                  <a
                    className="lm-radar-link"
                    href={bestOpportunity.permalink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver anúncio <ChevronRight size={16} />
                  </a>
                ) : null}
              </div>
            ) : (
              <div className="lm-radar-empty">
                <strong>Nenhuma análise ainda</strong>
                <p>Faça uma busca para encontrar oportunidades.</p>
              </div>
            )}
          </article>

          <article className="lm-radar-panel">
            <div className="lm-radar-tabs">
              {tabButtons.map((item) => {
                const isActive = tab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`lm-radar-tab ${isActive ? "is-active" : ""}`}
                    onClick={() => setTab(item.id)}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {tab === "keywords" && (
              <div className="lm-radar-list">
                <h2>Keywords para explorar</h2>

                {(data?.opportunities ?? []).length > 0 ? (
                  (data?.opportunities ?? []).map((item) => (
                    <div key={item.keyword} className="lm-radar-list-item">
                      <div>
                        <strong>{item.keyword}</strong>
                        <p>{item.title}</p>
                        <div className="lm-radar-meta-row">
                          <span>{item.competitionLevel} concorrência</span>
                          <span>{item.soldQuantity} vendidos</span>
                          <span>{formatMoney(item.price)}</span>
                        </div>
                      </div>

                      <span className="lm-radar-score-pill">
                        {item.opportunityScore}/100
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="lm-radar-empty">
                    <strong>Nenhuma keyword carregada</strong>
                    <p>Faça uma análise para ver sugestões.</p>
                  </div>
                )}
              </div>
            )}

            {tab === "ranking" && (
              <div className="lm-radar-list">
                <h2>Ranking da semana</h2>

                {ranking.length ? (
                  ranking.map((item) => (
                    <div key={item.keyword} className="lm-radar-list-item">
                      <div>
                        <strong>{item.keyword}</strong>
                        <p>{item.seenCount} aparições recentes</p>
                      </div>

                      <span className="lm-radar-score-pill">
                        {item.bestScore}/100
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="lm-radar-empty">
                    <strong>Ranking vazio</strong>
                    <p>O ranking será preenchido conforme o uso do módulo.</p>
                  </div>
                )}
              </div>
            )}

            {tab === "favorites" && (
              <div className="lm-radar-list">
                <h2>Favoritos</h2>

                {favorites.length ? (
                  favorites.map((item) => (
                    <div key={item.id} className="lm-radar-list-item">
                      <div>
                        <strong>{item.keyword}</strong>
                        <p>Favorito salvo no radar</p>
                      </div>

                      <span className="lm-radar-score-pill">
                        {item.opportunity_score}/100
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="lm-radar-empty">
                    <strong>Sem favoritos</strong>
                    <p>Salve oportunidades para acompanhar depois.</p>
                  </div>
                )}
              </div>
            )}

            {tab === "history" && (
              <div className="lm-radar-list">
                <h2>Histórico de buscas</h2>

                {history.length ? (
                  history.map((item) => (
                    <div key={item.id} className="lm-radar-list-item">
                      <div>
                        <strong>{item.query}</strong>
                        <p>Busca analisada anteriormente</p>
                      </div>

                      <span className="lm-radar-score-pill">
                        {item.opportunity_score}/100
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="lm-radar-empty">
                    <strong>Histórico vazio</strong>
                    <p>As buscas consultadas aparecerão aqui.</p>
                  </div>
                )}
              </div>
            )}

            {tab === "sellers" && (
              <div className="lm-radar-list">
                <h2>Sellers dominando o nicho</h2>

                {(data?.sellers ?? []).length ? (
                  (data?.sellers ?? []).map((item) => (
                    <div key={item.seller} className="lm-radar-list-item">
                      <div>
                        <strong>{item.seller}</strong>
                        <p>{item.items} anúncios na amostra</p>
                      </div>

                      <div className="lm-radar-seller-side">
                        <span>{item.share}% share</span>
                        <span>{item.powerSeller}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="lm-radar-empty">
                    <strong>Sem sellers listados</strong>
                    <p>Faça uma análise para ver os principais players.</p>
                  </div>
                )}
              </div>
            )}
          </article>
        </div>

        <aside className="lm-radar-side">
          <article className="lm-radar-panel">
            <h2>Resumo do mercado</h2>

            {market ? (
              <div className="lm-radar-summary">
                <div className="lm-radar-summary__row">
                  <span>Anúncios ativos</span>
                  <strong>{market.activeListings}</strong>
                </div>

                <div className="lm-radar-summary__row">
                  <span>Sellers únicos</span>
                  <strong>{market.uniqueSellers}</strong>
                </div>

                <div className="lm-radar-summary__row">
                  <span>Faixa de preço</span>
                  <strong>
                    {formatMoney(market.minPrice)} — {formatMoney(market.maxPrice)}
                  </strong>
                </div>

                <div className="lm-radar-summary__row">
                  <span>Frete grátis</span>
                  <strong>{market.freeShippingRate}%</strong>
                </div>

                <div className="lm-radar-summary__row">
                  <span>Catálogo</span>
                  <strong>{market.catalogRate}%</strong>
                </div>

                <div className="lm-radar-summary__row">
                  <span>Concentração topo</span>
                  <strong>{market.topSellerShare}%</strong>
                </div>
              </div>
            ) : (
              <div className="lm-radar-empty">
                <strong>Sem dados ainda</strong>
                <p>O resumo aparece após a primeira análise.</p>
              </div>
            )}
          </article>

          <article className="lm-radar-panel">
            <h2>Destaques</h2>

            {(data?.highlights ?? []).length ? (
              <ul className="lm-radar-highlights">
                {data?.highlights.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <div className="lm-radar-empty">
                <strong>Sem destaques</strong>
                <p>Os principais pontos da análise aparecerão aqui.</p>
              </div>
            )}
          </article>
        </aside>
      </section>
    </div>
  );
}

