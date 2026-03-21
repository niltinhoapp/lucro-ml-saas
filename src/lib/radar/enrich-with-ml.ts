const ML_API_BASE = "https://api.mercadolibre.com";
const MLB_SITE_ID = "MLB";

export type PdfProduct = {
  title: string;
  estimatedCost: number | null;
  possibleSku: string | null;
  categoryHint: string | null;
  opportunityLevel: "baixa" | "media" | "alta";
  notes: string[];
};

export type EnrichedPdfProduct = PdfProduct & {
  mlAveragePrice: number | null;
  mlDemandScore: number;
  mlCompetitionScore: number;
  marginPercent: number | null;
  finalScore: number;
  risk: "baixo" | "moderado" | "alto";
  mlSampleSize: number;
  mlTopTitles: string[];
};

type MlSearchItem = {
  title?: string;
  price?: number;
  sold_quantity?: number;
};

type MlSearchResponse = {
  paging?: { total?: number };
  results?: MlSearchItem[];
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function avg(values: number[]) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function computeDemandScore(avgSold: number) {
  if (avgSold >= 100) return 90;
  if (avgSold >= 50) return 75;
  if (avgSold >= 20) return 60;
  if (avgSold >= 5) return 40;
  return 20;
}

function computeCompetitionScore(total: number) {
  if (total <= 80) return 80;
  if (total <= 250) return 65;
  if (total <= 700) return 50;
  if (total <= 1500) return 35;
  return 20;
}

function computeMarginPercent(price: number | null, cost: number | null) {
  if (!price || !cost || price <= 0) return null;

  const netSale = price * 0.84;
  const margin = ((netSale - cost) / price) * 100;
  return Number(margin.toFixed(1));
}

function computeRisk(
  margin: number | null,
  demand: number,
  competition: number
): "baixo" | "moderado" | "alto" {
  if (margin !== null && margin >= 20 && demand >= 60 && competition >= 45) {
    return "baixo";
  }
  if (margin !== null && margin >= 8 && demand >= 40) {
    return "moderado";
  }
  return "alto";
}

function computeFinalScore(
  margin: number | null,
  demand: number,
  competition: number
) {
  const marginScore =
    margin === null ? 20 : clamp(Math.round(margin * 2.2), 0, 100);

  const score =
    marginScore * 0.45 +
    demand * 0.30 +
    competition * 0.25;

  return Math.round(clamp(score, 0, 100));
}

async function searchMl(query: string): Promise<MlSearchResponse> {
  const url = new URL(`${ML_API_BASE}/sites/${MLB_SITE_ID}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "8");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Falha ML search: ${res.status}`);
  }

  return (await res.json()) as MlSearchResponse;
}

export async function enrichProductsWithMlData(
  products: PdfProduct[]
): Promise<EnrichedPdfProduct[]> {
  const results: EnrichedPdfProduct[] = [];

  for (const product of products) {
    try {
      const ml = await searchMl(product.title);
      const hits = Array.isArray(ml.results) ? ml.results : [];
      const total = ml.paging?.total ?? 0;

      const prices = hits
        .map((x) => x.price)
        .filter((x): x is number => typeof x === "number" && x > 0);

      const solds = hits
        .map((x) => x.sold_quantity)
        .filter((x): x is number => typeof x === "number" && x >= 0);

      const avgPrice = avg(prices);
      const avgSold = avg(solds) ?? 0;

      const demand = computeDemandScore(avgSold);
      const competition = computeCompetitionScore(total);
      const margin = computeMarginPercent(avgPrice, product.estimatedCost);
      const finalScore = computeFinalScore(margin, demand, competition);
      const risk = computeRisk(margin, demand, competition);

      results.push({
        ...product,
        mlAveragePrice: avgPrice ? Number(avgPrice.toFixed(2)) : null,
        mlDemandScore: demand,
        mlCompetitionScore: competition,
        marginPercent: margin,
        finalScore,
        risk,
        mlSampleSize: hits.length,
        mlTopTitles: hits.slice(0, 3).map((x) => x.title || "").filter(Boolean),
      });
    } catch {
      results.push({
        ...product,
        mlAveragePrice: null,
        mlDemandScore: 0,
        mlCompetitionScore: 0,
        marginPercent: null,
        finalScore: 0,
        risk: "alto",
        mlSampleSize: 0,
        mlTopTitles: [],
      });
    }
  }

  return results.sort((a, b) => b.finalScore - a.finalScore);
}