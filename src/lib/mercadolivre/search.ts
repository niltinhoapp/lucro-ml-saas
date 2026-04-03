import { mlFetch } from "./client";
type MlSearchItem = {
  price?: number | null;
};

type MlSearchResponse = {
  results?: MlSearchItem[];
};

export type MlSearchResult = {
  avgPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  resultsCount: number;
};

function normalizeQuery(query: string) {
  return String(query || "")
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s\-]/gu, " ")
    .trim()
    .slice(0, 100);
}

function emptyResult(): MlSearchResult {
  return {
    avgPrice: null,
    minPrice: null,
    maxPrice: null,
    resultsCount: 0,
  };
}

export async function searchMlReal(query: string): Promise<MlSearchResult> {
  try {
    const normalizedQuery = normalizeQuery(query);

    if (!normalizedQuery) {
      return emptyResult();
    }

    const response = await fetch(
      `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(
        normalizedQuery
      )}&limit=10`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("[searchMlReal] erro ML:", response.status, errorText);
      return emptyResult();
    }

    const data = (await response.json()) as MlSearchResponse;

    const prices = (data.results || [])
      .map((item) => Number(item?.price))
      .filter((price) => Number.isFinite(price) && price > 0);

    if (!prices.length) {
      return emptyResult();
    }

    const avg =
      prices.reduce((acc, price) => acc + price, 0) / prices.length;

    return {
      avgPrice: Number(avg.toFixed(2)),
      minPrice: Number(Math.min(...prices).toFixed(2)),
      maxPrice: Number(Math.max(...prices).toFixed(2)),
      resultsCount: prices.length,
    };
  } catch (error) {
    console.error("[searchMlReal] erro:", error);
    return emptyResult();
  }
}