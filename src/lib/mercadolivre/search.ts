import { mlFetch } from "./client";

type MlSearchItem = {
  id?: string;
  title?: string;
  price?: number | null;
  condition?: string | null;
  currency_id?: string | null;
  available_quantity?: number | null;
  sold_quantity?: number | null;
  buying_mode?: string | null;
  listing_type_id?: string | null;
  category_id?: string | null;
  official_store_id?: number | null;
  accepts_mercadopago?: boolean | null;
  permalink?: string | null;
};

type MlSearchResponse = {
  results?: MlSearchItem[];
};

export type MlValidationStatus = "validated" | "partial" | "not_validated";

export type MlSearchComparable = {
  id: string | null;
  title: string;
  price: number;
  condition: string | null;
  soldQuantity: number;
  listingTypeId: string | null;
  permalink: string | null;
  matchScore: number;
};

export type MlSearchResult = {
  query: string;
  normalizedQuery: string;
  validatedPrice: number | null;
  medianPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  avgPrice: number | null;
  resultsCount: number;
  comparableCount: number;
  confidence: number;
  status: MlValidationStatus;
  comparables: MlSearchComparable[];
};

function normalizeQuery(query: string) {
  return String(query || "")
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s/-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function normalizeText(value: string) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s/-]/gu, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length >= 2);
}

function median(values: number[]) {
  if (!values.length) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 !== 0) {
    return Number(sorted[middle].toFixed(2));
  }

  return Number(((sorted[middle - 1] + sorted[middle]) / 2).toFixed(2));
}

function average(values: number[]) {
  if (!values.length) return null;
  const avg = values.reduce((acc, value) => acc + value, 0) / values.length;
  return Number(avg.toFixed(2));
}

function computeMatchScore(query: string, title: string) {
  const queryTokens = tokenize(query);
  const titleTokens = new Set(tokenize(title));

  if (!queryTokens.length || !titleTokens.size) return 0;

  let hits = 0;
  for (const token of queryTokens) {
    if (titleTokens.has(token)) hits += 1;
  }

  const score = hits / queryTokens.length;
  return Number(score.toFixed(2));
}

function isLikelyBadComparable(title: string) {
  const normalized = normalizeText(title);

  const blockedTerms = [
    "usado",
    "defeito",
    "quebrado",
    "peças",
    "pecas",
    "assistencia",
    "reparo",
    "somente gabinete",
    "vazio",
    "caixa vazia",
    "manual",
    "adesivo",
    "capa",
    "pelicula",
  ];

  return blockedTerms.some((term) => normalized.includes(term));
}

function buildStatus(comparableCount: number, confidence: number): MlValidationStatus {
  if (comparableCount >= 3 && confidence >= 75) return "validated";
  if (comparableCount >= 1 && confidence >= 40) return "partial";
  return "not_validated";
}

function emptyResult(query: string, normalizedQuery: string): MlSearchResult {
  return {
    query,
    normalizedQuery,
    validatedPrice: null,
    medianPrice: null,
    minPrice: null,
    maxPrice: null,
    avgPrice: null,
    resultsCount: 0,
    comparableCount: 0,
    confidence: 0,
    status: "not_validated",
    comparables: [],
  };
}

export async function searchMlReal(query: string): Promise<MlSearchResult> {
  const normalizedQuery = normalizeQuery(query);

  if (!normalizedQuery) {
    return emptyResult(query, normalizedQuery);
  }

  try {
    const data = await mlFetch<MlSearchResponse>(
      `/sites/MLB/search?q=${encodeURIComponent(normalizedQuery)}&limit=20`
    );

    const rawResults = Array.isArray(data?.results) ? data.results : [];

    const comparables = rawResults
      .map((item): MlSearchComparable | null => {
        const price = Number(item?.price);
        const title = String(item?.title ?? "").trim();
        const condition = item?.condition ?? null;
        const soldQuantity = Number(item?.sold_quantity ?? 0);
        const listingTypeId = item?.listing_type_id ?? null;
        const permalink = item?.permalink ?? null;
        const matchScore = computeMatchScore(normalizedQuery, title);

        if (!title) return null;
        if (!Number.isFinite(price) || price <= 0) return null;
        if (condition && condition !== "new") return null;
        if (isLikelyBadComparable(title)) return null;
        if (matchScore < 0.45) return null;

        return {
          id: item?.id ?? null,
          title,
          price,
          condition,
          soldQuantity,
          listingTypeId,
          permalink,
          matchScore,
        };
      })
      .filter((item): item is MlSearchComparable => Boolean(item))
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        if (b.soldQuantity !== a.soldQuantity) return b.soldQuantity - a.soldQuantity;
        return a.price - b.price;
      });

    if (!comparables.length) {
      return {
        ...emptyResult(query, normalizedQuery),
        resultsCount: rawResults.length,
      };
    }

    const prices = comparables.map((item) => item.price);
    const medianPrice = median(prices);
    const avgPrice = average(prices);
    const minPrice = Number(Math.min(...prices).toFixed(2));
    const maxPrice = Number(Math.max(...prices).toFixed(2));

    const comparableCount = comparables.length;

    const confidenceBase =
      comparableCount >= 6 ? 85 :
      comparableCount >= 4 ? 75 :
      comparableCount >= 2 ? 55 :
      40;

    const qualityBoost =
      comparables[0]?.matchScore >= 0.8 ? 10 :
      comparables[0]?.matchScore >= 0.65 ? 5 :
      0;

    const confidence = Math.min(100, confidenceBase + qualityBoost);
    const status = buildStatus(comparableCount, confidence);

    return {
      query,
      normalizedQuery,
      validatedPrice: status === "not_validated" ? null : medianPrice,
      medianPrice,
      minPrice,
      maxPrice,
      avgPrice,
      resultsCount: rawResults.length,
      comparableCount,
      confidence,
      status,
      comparables,
    };
  } catch (error) {
    console.error("[searchMlReal] erro:", error);

    return emptyResult(query, normalizedQuery);
  }
}