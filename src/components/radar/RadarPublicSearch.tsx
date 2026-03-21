"use client";

import { useMemo, useState } from "react";

type OpportunityHealth = {
  demand: "baixa" | "media" | "alta";
  competition: "baixa" | "media" | "alta";
  opportunityScore: number;
  recommendation: "testar" | "observar" | "evitar";
};

type RadarOpportunity = {
  id: string;
  title: string;
  price: number | null;
  originalPrice: number | null;
  soldQuantity: number;
  availableQuantity: number | null;
  condition: string | null;
  categoryId: string | null;
  domainId: string | null;
  permalink: string | null;
  catalogListing: boolean;
  freeShipping: boolean;
  logisticType: string | null;
  sellerNickname: string | null;
  sellerId: number | null;
  listingTypeId: string | null;
  acceptsMercadoPago: boolean;
  health: OpportunityHealth;
};

type RadarPublicResponse = {
  ok: boolean;
  source: "ml_public_search";
  query: string;
  total: number;
  items: RadarOpportunity[];
  error?: string;
  details?: string;
};

type AnalyzeInsight = {
  summary: string;
  bestOpportunity: {
    id: string;
    title: string;
    price: number | null;
    soldQuantity: number;
    score: number;
    recommendation: "testar" | "observar" | "evitar";
    reasons: string[];
    alerts: string[];
  } | null;
  highlights: Array<{
    id: string;
    title: string;
    score: number;
    recommendation: "testar" | "observar" | "evitar";
    reasons: string[];
  }>;
  marketReading: {
    averagePrice: number | null;
    averageSoldQuantity: number | null;
    demandDistribution: {
      baixa: number;
      media: number;
      alta: number;
    };
    recommendationSummary: {
      testar: number;
      observar: number;
      evitar: number;
    };
  };
};

type AnalyzeResponse = {
  ok: boolean;
  source: "ml_public_search" | "pdf_catalog" | "seller_match";
  query: string;
  total: number;
  insight: AnalyzeInsight;
  error?: string;
  details?: string;
};

function brl(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function badgeClassByRecommendation(
  recommendation: "testar" | "observar" | "evitar"
) {
  switch (recommendation) {
    case "testar":
      return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30";
    case "observar":
      return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30";
    case "evitar":
      return "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30";
    default:
      return "bg-white/10 text-white ring-1 ring-white/10";
  }
}

function badgeClassByDemand(demand: "baixa" | "media" | "alta") {
  switch (demand) {
    case "alta":
      return "bg-emerald-500/15 text-emerald-300";
    case "media":
      return "bg-amber-500/15 text-amber-300";
    case "baixa":
      return "bg-rose-500/15 text-rose-300";
    default:
      return "bg-white/10 text-white";
  }
}

function scoreBarClass(score: number) {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 45) return "bg-amber-500";
  return "bg-rose-500";
}

export default function RadarPublicSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [publicData, setPublicData] = useState<RadarPublicResponse | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bestPublicItem = useMemo(
    () => publicData?.items?.[0] ?? null,
    [publicData]
  );

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();

    const q = query.trim();
    if (q.length < 2) {
      setError("Digite pelo menos 2 caracteres para buscar.");
      setPublicData(null);
      setAnalysisData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setPublicData(null);
      setAnalysisData(null);

      const publicRes = await fetch(
        `/api/radar/public?q=${encodeURIComponent(q)}&limit=12`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const publicJson = (await publicRes.json()) as RadarPublicResponse;

      if (!publicRes.ok || !publicJson.ok) {
        throw new Error(
          publicJson.error || "Falha ao consultar o Radar Público."
        );
      }

      setPublicData(publicJson);

      const analyzeRes = await fetch("/api/radar/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: q,
          source: "ml_public_search",
          items: publicJson.items,
        }),
      });

      const analyzeJson = (await analyzeRes.json()) as AnalyzeResponse;

      if (!analyzeRes.ok || !analyzeJson.ok) {
        throw new Error(
          analyzeJson.error || "Falha ao analisar os resultados do radar."
        );
      }

      setAnalysisData(analyzeJson);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro inesperado na busca.";
      setError(message);
      setPublicData(null);
      setAnalysisData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="p-5 border shadow-2xl rounded-3xl border-white/10 bg-zinc-950">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white">
            Radar de oportunidades
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Busque na API pública do Mercado Livre, ranqueie os itens e gere uma
            leitura inteligente de oportunidade.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex.: boneca, mochila, parafuso, ventilador..."
            className="flex-1 h-12 px-4 text-sm text-white border outline-none rounded-2xl border-white/10 bg-zinc-900 placeholder:text-zinc-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="h-12 px-5 text-sm font-semibold transition bg-white rounded-2xl text-zinc-950 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {error ? (
          <div className="px-4 py-3 mt-4 text-sm border rounded-2xl border-rose-500/30 bg-rose-500/10 text-rose-200">
            {error}
          </div>
        ) : null}
      </div>

      {analysisData?.insight ? (
        <div className="p-5 border shadow-2xl rounded-3xl border-white/10 bg-zinc-950">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Resumo inteligente
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-white">
              Leitura do radar
            </h3>
            <p className="mt-2 text-sm text-zinc-300">
              {analysisData.insight.summary}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="p-4 border rounded-2xl border-white/10 bg-zinc-900">
              <p className="text-xs text-zinc-500">Preço médio</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {brl(analysisData.insight.marketReading.averagePrice)}
              </p>
            </div>

            <div className="p-4 border rounded-2xl border-white/10 bg-zinc-900">
              <p className="text-xs text-zinc-500">Vendidos médios</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {analysisData.insight.marketReading.averageSoldQuantity ?? "—"}
              </p>
            </div>

            <div className="p-4 border rounded-2xl border-white/10 bg-zinc-900">
              <p className="text-xs text-zinc-500">Itens para testar</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {analysisData.insight.marketReading.recommendationSummary.testar}
              </p>
            </div>

            <div className="p-4 border rounded-2xl border-white/10 bg-zinc-900">
              <p className="text-xs text-zinc-500">Itens para observar</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {
                  analysisData.insight.marketReading.recommendationSummary
                    .observar
                }
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {analysisData?.insight.bestOpportunity ? (
        <div className="p-5 border shadow-2xl rounded-3xl border-white/10 bg-zinc-950">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Melhor oportunidade encontrada
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                {analysisData.insight.bestOpportunity.title}
              </h3>
              <p className="mt-2 text-sm text-zinc-400">
                Recomendação inicial baseada em sinais públicos do marketplace.
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${badgeClassByRecommendation(
                analysisData.insight.bestOpportunity.recommendation
              )}`}
            >
              {analysisData.insight.bestOpportunity.recommendation}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="p-4 border rounded-2xl border-white/10 bg-zinc-900">
              <p className="text-xs text-zinc-500">Preço</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {brl(analysisData.insight.bestOpportunity.price)}
              </p>
            </div>

            <div className="p-4 border rounded-2xl border-white/10 bg-zinc-900">
              <p className="text-xs text-zinc-500">Vendidos</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {analysisData.insight.bestOpportunity.soldQuantity}
              </p>
            </div>

            <div className="p-4 border rounded-2xl border-white/10 bg-zinc-900">
              <p className="text-xs text-zinc-500">Score</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {analysisData.insight.bestOpportunity.score}/100
              </p>
            </div>

            <div className="p-4 border rounded-2xl border-white/10 bg-zinc-900">
              <p className="text-xs text-zinc-500">Busca</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {analysisData.query}
              </p>
            </div>
          </div>

          <div className="w-full h-2 mt-4 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full ${scoreBarClass(
                analysisData.insight.bestOpportunity.score
              )}`}
              style={{
                width: `${analysisData.insight.bestOpportunity.score}%`,
              }}
            />
          </div>

          <div className="grid gap-4 mt-5 lg:grid-cols-2">
            <div className="p-4 border rounded-2xl border-white/10 bg-zinc-900">
              <p className="text-sm font-semibold text-white">
                Por que vale atenção
              </p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                {analysisData.insight.bestOpportunity.reasons.map((reason) => (
                  <li key={reason}>• {reason}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 border rounded-2xl border-white/10 bg-zinc-900">
              <p className="text-sm font-semibold text-white">Alertas</p>
              {analysisData.insight.bestOpportunity.alerts.length ? (
                <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                  {analysisData.insight.bestOpportunity.alerts.map((alert) => (
                    <li key={alert}>• {alert}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-zinc-400">
                  Nenhum alerta forte nessa leitura inicial.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {analysisData?.insight.highlights?.length ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Highlights do radar
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              Os itens com melhor leitura para teste inicial.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {analysisData.insight.highlights.map((item) => (
              <article
                key={item.id}
                className="p-5 border shadow-xl rounded-3xl border-white/10 bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-lg font-semibold text-white">
                    {item.title}
                  </h4>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${badgeClassByRecommendation(
                      item.recommendation
                    )}`}
                  >
                    {item.recommendation}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-zinc-400">Score</p>
                    <p className="text-sm font-semibold text-white">
                      {item.score}/100
                    </p>
                  </div>

                  <div className="w-full h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full ${scoreBarClass(item.score)}`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 mt-4 border rounded-2xl border-white/10 bg-zinc-900">
                  <p className="text-sm font-semibold text-white">
                    Motivos principais
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                    {item.reasons.map((reason) => (
                      <li key={reason}>• {reason}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {publicData?.items?.length ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Resultados brutos do Mercado Livre
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              {publicData.total.toLocaleString("pt-BR")} resultados públicos para{" "}
              <span className="font-medium text-white">"{publicData.query}"</span>.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {publicData.items.map((item) => (
              <article
                key={item.id}
                className="p-5 border shadow-xl rounded-3xl border-white/10 bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-white">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-sm text-zinc-400">
                      Seller: {item.sellerNickname || "—"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${badgeClassByRecommendation(
                      item.health.recommendation
                    )}`}
                  >
                    {item.health.recommendation}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 md:grid-cols-4">
                  <div className="p-3 border rounded-2xl border-white/10 bg-zinc-900">
                    <p className="text-[11px] text-zinc-500">Preço</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {brl(item.price)}
                    </p>
                  </div>

                  <div className="p-3 border rounded-2xl border-white/10 bg-zinc-900">
                    <p className="text-[11px] text-zinc-500">Vendidos</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {item.soldQuantity}
                    </p>
                  </div>

                  <div className="p-3 border rounded-2xl border-white/10 bg-zinc-900">
                    <p className="text-[11px] text-zinc-500">Demanda</p>
                    <p
                      className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-semibold capitalize ${badgeClassByDemand(
                        item.health.demand
                      )}`}
                    >
                      {item.health.demand}
                    </p>
                  </div>

                  <div className="p-3 border rounded-2xl border-white/10 bg-zinc-900">
                    <p className="text-[11px] text-zinc-500">Score</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {item.health.opportunityScore}/100
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 text-xs text-zinc-300">
                  {item.freeShipping ? (
                    <span className="px-3 py-1 border rounded-full border-white/10 bg-white/5">
                      Frete grátis
                    </span>
                  ) : null}

                  {item.catalogListing ? (
                    <span className="px-3 py-1 border rounded-full border-white/10 bg-white/5">
                      Catálogo
                    </span>
                  ) : null}

                  {item.logisticType ? (
                    <span className="px-3 py-1 border rounded-full border-white/10 bg-white/5">
                      {item.logisticType}
                    </span>
                  ) : null}

                  {item.listingTypeId ? (
                    <span className="px-3 py-1 border rounded-full border-white/10 bg-white/5">
                      {item.listingTypeId}
                    </span>
                  ) : null}
                </div>

                {item.permalink ? (
                  <a
                    href={item.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex mt-4 text-sm font-medium underline text-zinc-200 underline-offset-4"
                  >
                    Ver anúncio no Mercado Livre
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}