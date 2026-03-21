import { NextRequest, NextResponse } from "next/server";

const ML_API_BASE = "https://api.mercadolibre.com";
const MLB_SITE_ID = "MLB";
const ML_TIMEOUT_MS = 20_000;

type MlSeller = {
  id?: number;
  nickname?: string;
  reputation?: {
    power_seller_status?: string | null;
  };
};

type MlSearchItem = {
  id: string;
  title: string;
  price?: number;
  original_price?: number | null;
  available_quantity?: number | string;
  sold_quantity?: number;
  condition?: string;
  buying_mode?: string;
  listing_type_id?: string;
  category_id?: string;
  domain_id?: string | null;
  permalink?: string;
  catalog_listing?: boolean;
  official_store_id?: number | null;
  accepts_mercadopago?: boolean;
  seller?: MlSeller;
  shipping?: {
    free_shipping?: boolean;
    logistic_type?: string | null;
    store_pick_up?: boolean;
  };
  attributes?: Array<{
    id?: string;
    name?: string;
    value_name?: string | null;
  }>;
};

type MlSearchResponse = {
  site_id?: string;
  query?: string;
  paging?: {
    total?: number;
    offset?: number;
    limit?: number;
    primary_results?: number;
  };
  results?: MlSearchItem[];
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
  health: {
    demand: "baixa" | "media" | "alta";
    competition: "baixa" | "media" | "alta";
    opportunityScore: number;
    recommendation: "testar" | "observar" | "evitar";
  };
};

type RadarPublicResponse = {
  ok: boolean;
  source: "ml_public_search";
  query: string;
  total: number;
  items: RadarOpportunity[];
};

function normalizeText(value: string) {
  return value.trim();
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Na busca pública do ML, available_quantity pode vir "referencial".
 * A doc oficial informa valores em faixas como RANGO_1_50, RANGO_51_100 etc. :contentReference[oaicite:1]{index=1}
 */
function parseAvailableQuantity(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value !== "string") return null;

  const map: Record<string, number> = {
    RANGO_1_50: 1,
    RANGO_51_100: 50,
    RANGO_101_150: 100,
    RANGO_151_200: 150,
    RANGO_201_250: 200,
    RANGO_251_500: 250,
    RANGO_501_5000: 500,
    RANGO_5001_50000: 5000,
    RANGO_50001_99999: 50000,
  };

  return map[value] ?? null;
}

function inferDemand(soldQuantity: number): "baixa" | "media" | "alta" {
  if (soldQuantity >= 100) return "alta";
  if (soldQuantity >= 20) return "media";
  return "baixa";
}

function inferCompetition(totalResults: number): "baixa" | "media" | "alta" {
  if (totalResults >= 1500) return "alta";
  if (totalResults >= 400) return "media";
  return "baixa";
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function computeOpportunityScore(params: {
  soldQuantity: number;
  totalResults: number;
  freeShipping: boolean;
  catalogListing: boolean;
  acceptsMercadoPago: boolean;
}) {
  const demandScore = clamp(params.soldQuantity, 0, 120);
  const competitionPenalty =
    params.totalResults >= 1500 ? 35 : params.totalResults >= 400 ? 18 : 5;

  const shippingBonus = params.freeShipping ? 6 : 0;
  const catalogBonus = params.catalogListing ? 4 : 0;
  const mpBonus = params.acceptsMercadoPago ? 3 : 0;

  const raw =
    50 +
    demandScore * 0.35 +
    shippingBonus +
    catalogBonus +
    mpBonus -
    competitionPenalty;

  return Math.round(clamp(raw, 0, 100));
}

function recommendationFromScore(
  score: number
): "testar" | "observar" | "evitar" {
  if (score >= 70) return "testar";
  if (score >= 45) return "observar";
  return "evitar";
}

function mapItemToOpportunity(
  item: MlSearchItem,
  totalResults: number
): RadarOpportunity {
  const soldQuantity = toNumber(item.sold_quantity) ?? 0;
  const availableQuantity = parseAvailableQuantity(item.available_quantity);
  const price = toNumber(item.price);
  const originalPrice = toNumber(item.original_price);
  const freeShipping = Boolean(item.shipping?.free_shipping);
  const catalogListing = Boolean(item.catalog_listing);
  const acceptsMercadoPago = Boolean(item.accepts_mercadopago);

  const demand = inferDemand(soldQuantity);
  const competition = inferCompetition(totalResults);
  const opportunityScore = computeOpportunityScore({
    soldQuantity,
    totalResults,
    freeShipping,
    catalogListing,
    acceptsMercadoPago,
  });

  return {
    id: item.id,
    title: item.title,
    price,
    originalPrice,
    soldQuantity,
    availableQuantity,
    condition: item.condition ?? null,
    categoryId: item.category_id ?? null,
    domainId: item.domain_id ?? null,
    permalink: item.permalink ?? null,
    catalogListing,
    freeShipping,
    logisticType: item.shipping?.logistic_type ?? null,
    sellerNickname: item.seller?.nickname ?? null,
    sellerId: item.seller?.id ?? null,
    listingTypeId: item.listing_type_id ?? null,
    acceptsMercadoPago,
    health: {
      demand,
      competition,
      opportunityScore,
      recommendation: recommendationFromScore(opportunityScore),
    },
  };
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const q = normalizeText(searchParams.get("q") ?? "");
    const limitParam = Number(searchParams.get("limit") ?? "12");
    const offsetParam = Number(searchParams.get("offset") ?? "0");

    const limit = Number.isFinite(limitParam)
      ? clamp(limitParam, 1, 50)
      : 12;

    const offset = Number.isFinite(offsetParam)
      ? Math.max(0, offsetParam)
      : 0;

    if (!q || q.length < 2) {
      return NextResponse.json(
        {
          ok: false,
          error: "Informe um termo de busca com pelo menos 2 caracteres.",
        },
        { status: 400 }
      );
    }

    const endpoint = new URL(`${ML_API_BASE}/sites/${MLB_SITE_ID}/search`);
    endpoint.searchParams.set("q", q);
    endpoint.searchParams.set("limit", String(limit));
    endpoint.searchParams.set("offset", String(offset));

    // opcional: você pode experimentar relevance / price_asc / price_desc
    // endpoint.searchParams.set("sort", "relevance");

    const response = await fetchWithTimeout(endpoint.toString());

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return NextResponse.json(
        {
          ok: false,
          error: "Falha ao consultar a busca pública do Mercado Livre.",
          status: response.status,
          details: errorText || null,
        },
        { status: 502 }
      );
    }

    const data = (await response.json()) as MlSearchResponse;

    const total = data.paging?.total ?? 0;
    const rawItems = Array.isArray(data.results) ? data.results : [];

    const items = rawItems
      .map((item) => mapItemToOpportunity(item, total))
      .sort(
        (a, b) =>
          b.health.opportunityScore - a.health.opportunityScore ||
          b.soldQuantity - a.soldQuantity
      );

    const payload: RadarPublicResponse = {
      ok: true,
      source: "ml_public_search",
      query: q,
      total,
      items,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno inesperado.";

    return NextResponse.json(
      {
        ok: false,
        error: "Erro ao processar o Radar Público.",
        details: message,
      },
      { status: 500 }
    );
  }
}