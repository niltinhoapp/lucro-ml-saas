import { NextRequest, NextResponse } from "next/server";

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

type AnalyzeRequestBody = {
  query?: string;
  source?: "ml_public_search" | "pdf_catalog" | "seller_match";
  items?: RadarOpportunity[];
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

function average(numbers: number[]) {
  if (!numbers.length) return null;
  const total = numbers.reduce((acc, value) => acc + value, 0);
  return Number((total / numbers.length).toFixed(2));
}

function buildReasons(item: RadarOpportunity): string[] {
  const reasons: string[] = [];

  if (item.health.opportunityScore >= 70) {
    reasons.push("score geral forte para teste inicial");
  }

  if (item.health.demand === "alta") {
    reasons.push("volume de vendidos indica demanda alta");
  } else if (item.health.demand === "media") {
    reasons.push("sinal moderado de procura no marketplace");
  }

  if (item.health.competition === "baixa") {
    reasons.push("concorrência aparente mais controlada");
  } else if (item.health.competition === "media") {
    reasons.push("concorrência administrável para validação");
  }

  if (item.freeShipping) {
    reasons.push("frete grátis pode melhorar conversão");
  }

  if (item.catalogListing) {
    reasons.push("item já aparece com sinal de catálogo");
  }

  if (item.logisticType === "fulfillment") {
    reasons.push("presença em fulfillment pode indicar operação mais madura");
  }

  if (item.originalPrice && item.price && item.originalPrice > item.price) {
    reasons.push("preço atual abaixo do original sugere apelo comercial");
  }

  if (!reasons.length) {
    reasons.push("item com sinais mistos, precisa validação cuidadosa");
  }

  return reasons;
}

function buildAlerts(item: RadarOpportunity): string[] {
  const alerts: string[] = [];

  if (item.health.competition === "alta") {
    alerts.push("muitos resultados na busca pública");
  }

  if (item.health.demand === "baixa") {
    alerts.push("baixo volume aparente de vendidos");
  }

  if ((item.price ?? 0) > 500) {
    alerts.push("ticket mais alto pode exigir capital maior");
  }

  if (!item.freeShipping) {
    alerts.push("sem frete grátis, pode perder competitividade");
  }

  if (item.availableQuantity !== null && item.availableQuantity <= 1) {
    alerts.push("estoque aparente baixo no anúncio observado");
  }

  return alerts;
}

function analyzeItems(
  query: string,
  items: RadarOpportunity[]
): AnalyzeInsight {
  const ordered = [...items].sort(
    (a, b) =>
      b.health.opportunityScore - a.health.opportunityScore ||
      b.soldQuantity - a.soldQuantity
  );

  const best = ordered[0] ?? null;

  const prices = ordered
    .map((item) => item.price)
    .filter((value): value is number => typeof value === "number");

  const solds = ordered
    .map((item) => item.soldQuantity)
    .filter((value): value is number => typeof value === "number");

  const demandDistribution = ordered.reduce(
    (acc, item) => {
      acc[item.health.demand] += 1;
      return acc;
    },
    { baixa: 0, media: 0, alta: 0 }
  );

  const recommendationSummary = ordered.reduce(
    (acc, item) => {
      acc[item.health.recommendation] += 1;
      return acc;
    },
    { testar: 0, observar: 0, evitar: 0 }
  );

  return {
    summary: best
      ? `Para "${query}", o item com melhor sinal inicial é "${best.title}", combinando score ${best.health.opportunityScore}/100 com demanda ${best.health.demand} e concorrência ${best.health.competition}.`
      : `Nenhuma oportunidade válida foi encontrada para "${query}".`,
    bestOpportunity: best
      ? {
          id: best.id,
          title: best.title,
          price: best.price,
          soldQuantity: best.soldQuantity,
          score: best.health.opportunityScore,
          recommendation: best.health.recommendation,
          reasons: buildReasons(best),
          alerts: buildAlerts(best),
        }
      : null,
    highlights: ordered.slice(0, 5).map((item) => ({
      id: item.id,
      title: item.title,
      score: item.health.opportunityScore,
      recommendation: item.health.recommendation,
      reasons: buildReasons(item).slice(0, 3),
    })),
    marketReading: {
      averagePrice: average(prices),
      averageSoldQuantity: average(solds),
      demandDistribution,
      recommendationSummary,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AnalyzeRequestBody;

    const query = body.query?.trim() ?? "";
    const items = Array.isArray(body.items) ? body.items : [];

    if (!query) {
      return NextResponse.json(
        {
          ok: false,
          error: "Informe a query analisada.",
        },
        { status: 400 }
      );
    }

    if (!items.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "Nenhum item foi enviado para análise.",
        },
        { status: 400 }
      );
    }

    const insight = analyzeItems(query, items);

    return NextResponse.json(
      {
        ok: true,
        source: body.source ?? "ml_public_search",
        query,
        total: items.length,
        insight,
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno inesperado.";

    return NextResponse.json(
      {
        ok: false,
        error: "Erro ao processar a análise do radar.",
        details: message,
      },
      { status: 500 }
    );
  }
}