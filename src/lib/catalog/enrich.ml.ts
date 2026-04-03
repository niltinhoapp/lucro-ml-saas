import { searchMlReal, type MlSearchResult } from "@/lib/mercadolivre/search";
import type { CatalogAnalysisRow, CatalogRiskLevel } from "./types";

const DEFAULT_ML_FEE_RATE = 0.16;
const DEFAULT_BATCH_SIZE = 4;

type EnrichMlOptions = {
  batchSize?: number;
};

function normalizeQueryPart(value: string | null | undefined): string {
  return String(value || "")
    .replace(/[^\p{L}\p{N}\s\-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchQuery(row: CatalogAnalysisRow): string {
  const parts = [
    normalizeQueryPart(row.brand),
    normalizeQueryPart(row.model),
    normalizeQueryPart(row.sku),
    normalizeQueryPart(row.productName),
  ].filter(Boolean);

  const joined = parts.join(" ").trim();

  if (!joined) {
    return normalizeQueryPart(row.productName);
  }

  return joined.slice(0, 100);
}

function calculateFreightEstimate(
  mlPriceAvg: number,
  productName: string
): number {
  const lower = String(productName || "").toLowerCase();

  const bulkyHints = [
    "geladeira",
    "caixa de som",
    "soundbar",
    "mesa",
    "patinete",
    "bicicleta",
    "máquina",
    "maquina",
    "fogão",
    "forno",
    "cooler",
    "caixa amplificada",
    "ventilador grande",
  ];

  if (bulkyHints.some((term) => lower.includes(term))) {
    if (mlPriceAvg < 200) return 25;
    if (mlPriceAvg < 500) return 38;
    if (mlPriceAvg < 1000) return 55;
    return 75;
  }

  if (mlPriceAvg < 79) return 12;
  if (mlPriceAvg < 150) return 18;
  if (mlPriceAvg < 300) return 22;
  return 28;
}

function calcDemand(resultsCount: number): number {
  if (resultsCount > 50) return 82;
  if (resultsCount > 30) return 75;
  if (resultsCount > 20) return 68;
  if (resultsCount > 10) return 60;
  if (resultsCount > 5) return 50;
  if (resultsCount > 2) return 42;
  return 28;
}

function calcCompetition(resultsCount: number): number {
  if (resultsCount > 50) return 95;
  if (resultsCount > 30) return 88;
  if (resultsCount > 20) return 80;
  if (resultsCount > 10) return 72;
  if (resultsCount > 5) return 60;
  if (resultsCount > 2) return 48;
  return 30;
}

function calcOpportunityScore(params: {
  estimatedMargin: number;
  demandScore: number;
  competitionScore: number;
  confidence: number;
}): number {
  const { estimatedMargin, demandScore, competitionScore, confidence } = params;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        estimatedMargin * 1.65 +
          demandScore * 0.34 -
          competitionScore * 0.24 +
          (confidence >= 0.8 ? 6 : 0)
      )
    )
  );
}

function deriveRiskLevel(
  estimatedMargin: number,
  confidence: number
): CatalogRiskLevel {
  if (estimatedMargin >= 22 && confidence >= 0.8) return "baixo";
  if (estimatedMargin < 10 || confidence < 0.55) return "alto";
  return "moderado";
}

function buildSellerSummary(
  riskLevel: CatalogRiskLevel,
  estimatedMargin: number,
  resultsCount: number
): string {
  if (riskLevel === "baixo") {
    if (resultsCount >= 20) {
      return "Boa oportunidade. Produto com preço validado no Mercado Livre e margem saudável.";
    }
    return "Boa margem estimada e sinal positivo para validação de compra.";
  }

  if (riskLevel === "alto") {
    if (estimatedMargin < 0) {
      return "Risco alto. O preço atual do mercado não protege a margem.";
    }
    return "Margem apertada ou confiança baixa. Revise antes de comprar.";
  }

  return "Oportunidade intermediária. Vale validar preço, concorrência e giro.";
}

function recalcRow(
  row: CatalogAnalysisRow,
  ml: MlSearchResult
): CatalogAnalysisRow {
  const currentPrice =
    row.mlPriceAvg && row.mlPriceAvg > 0
      ? row.mlPriceAvg
      : row.mlPriceMax && row.mlPriceMax > 0
      ? row.mlPriceMax
      : 0;

  const basePrice =
    ml.avgPrice && ml.avgPrice > 0 ? ml.avgPrice : currentPrice;

  if (!basePrice || basePrice <= 0) {
    return row;
  }

  const minPrice =
    ml.minPrice && ml.minPrice > 0 ? ml.minPrice : basePrice * 0.9;

  const maxPrice =
    ml.maxPrice && ml.maxPrice > 0 ? ml.maxPrice : basePrice * 1.1;

  const demandScore = calcDemand(ml.resultsCount);
  const competitionScore = calcCompetition(ml.resultsCount);

  const estimatedFees = Number((basePrice * DEFAULT_ML_FEE_RATE).toFixed(2));
  const estimatedShipping = Number(
    calculateFreightEstimate(basePrice, row.productName).toFixed(2)
  );

  const estimatedProfit = Number(
    (basePrice  - estimatedFees - estimatedShipping).toFixed(2)
  );

  const estimatedMargin = Number(
    (((estimatedProfit / basePrice) || 0) * 100).toFixed(2)
  );

  const opportunityScore = calcOpportunityScore({
    estimatedMargin,
    demandScore,
    competitionScore,
    confidence: row.confidence ?? 0,
  });

  const riskLevel = deriveRiskLevel(estimatedMargin, row.confidence ?? 0);
  const worthBuying = riskLevel !== "alto" && estimatedMargin >= 12;
  const aiSummary = buildSellerSummary(
    riskLevel,
    estimatedMargin,
    ml.resultsCount
  );

  return {
    ...row,
    mlPriceAvg: Number(basePrice.toFixed(2)),
    mlPriceMin: Number(minPrice.toFixed(2)),
    mlPriceMax: Number(maxPrice.toFixed(2)),
    estimatedFees,
    estimatedShipping,
    estimatedProfit,
    estimatedMargin,
    demandScore,
    competitionScore,
    opportunityScore,
    riskLevel,
    worthBuying,
    aiSummary,
  };
}

function dedupeRows(rows: CatalogAnalysisRow[]): CatalogAnalysisRow[] {
  const map = new Map<string, CatalogAnalysisRow>();

  for (const row of rows) {
    const key =
      normalizeQueryPart(row.sku).toLowerCase() ||
      `${normalizeQueryPart(row.productName).toLowerCase()}::${Number(
        row.supplierCost ?? 0
      ).toFixed(2)}`;

    if (!key) continue;

    const existing = map.get(key);

    if (!existing) {
      map.set(key, row);
      continue;
    }

    const existingScore = Number(existing.opportunityScore ?? 0);
    const nextScore = Number(row.opportunityScore ?? 0);

    if (nextScore >= existingScore) {
      map.set(key, row);
    }
  }

  return Array.from(map.values());
}

async function runInBatches<TInput, TOutput>(
  items: TInput[],
  batchSize: number,
  worker: (item: TInput) => Promise<TOutput>
): Promise<TOutput[]> {
  const output: TOutput[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const result = await Promise.all(batch.map(worker));
    output.push(...result);
  }

  return output;
}

export async function enrichMlReal(
  rows: CatalogAnalysisRow[],
  options: EnrichMlOptions = {}
): Promise<CatalogAnalysisRow[]> {
  const batchSize =
    typeof options.batchSize === "number" && options.batchSize > 0
      ? options.batchSize
      : DEFAULT_BATCH_SIZE;

  const uniqueRows = dedupeRows(rows);
  const searchCache = new Map<string, MlSearchResult>();

  const enriched = await runInBatches(uniqueRows, batchSize, async (row) => {
    try {
      const query = buildSearchQuery(row);

      if (!query) {
        return row;
      }

      let ml = searchCache.get(query);

      if (!ml) {
        ml = await searchMlReal(query);
        searchCache.set(query, ml);
      }

      if (!ml || ml.resultsCount === 0) {
        return row;
      }

      return recalcRow(row, ml);
    } catch (error) {
      console.error("[enrichMlReal] erro ao enriquecer item:", row.productName, error);
      return row;
    }
  });

  return enriched.sort((a, b) => b.opportunityScore - a.opportunityScore);
}