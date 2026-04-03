import type {
  CatalogAnalysisRow,
  ParsedCatalogRow,
  CatalogRiskLevel,
  CatalogSummary,
} from "./types";

const DEFAULT_ML_FEE_RATE = 0.16;

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeText(value: string | null | undefined) {
  return String(value || "").toLowerCase().trim();
}

function inferMlPriceAvgFromCost(
  supplierCost: number,
  productName: string
): number {
  const lower = normalizeText(productName);

  const lowTicketHints = [
    "lanterna",
    "luminária",
    "luminaria",
    "relógio",
    "relogio",
    "espelho",
    "plug",
    "adaptador",
    "umidificador",
    "ventilador",
    "microfone",
    "fone",
    "suporte",
    "mixer",
    "massageador",
  ];

  const bulkyHints = [
    "geladeira",
    "soundbar",
    "caixa de som",
    "caixa amplificada",
    "mesa",
    "bicicleta",
    "patinete",
  ];

  const isLowTicket = lowTicketHints.some((term) => lower.includes(term));
  const isBulky = bulkyHints.some((term) => lower.includes(term));

  if (isBulky) {
    return round(supplierCost * 1.9);
  }

  if (isLowTicket) {
    return round(supplierCost * 1.75);
  }

  return round(supplierCost * 1.85);
}

function calculateFreightEstimate(
  mlPriceAvg: number,
  productName: string
): number {
  const lower = normalizeText(productName);

  const bulkyHints = [
    "geladeira",
    "soundbar",
    "caixa de som",
    "caixa amplificada",
    "mesa",
    "bicicleta",
    "patinete",
  ];

  if (bulkyHints.some((term) => lower.includes(term))) {
    if (mlPriceAvg < 200) return 25;
    if (mlPriceAvg < 500) return 40;
    if (mlPriceAvg < 1000) return 60;
    return 75;
  }

  if (mlPriceAvg < 79) return 12;
  if (mlPriceAvg < 150) return 18;
  if (mlPriceAvg < 300) return 22;
  return 28;
}

function calculateDemandScore(
  productName: string,
  estimatedMargin: number
): number {
  const lower = normalizeText(productName);
  let base = 56;

  const highDemandHints = [
    "ventilador",
    "lanterna",
    "luminária",
    "luminaria",
    "relógio",
    "relogio",
    "umidificador",
    "microfone",
    "fone",
    "suporte",
    "mixer",
    "massageador",
  ];

  const nicheHints = [
    "geladeira portátil",
    "soundbar",
    "caixa amplificada",
    "máquina",
    "maquina",
    "fumaca",
    "fumaça",
  ];

  if (highDemandHints.some((term) => lower.includes(term))) base += 10;
  if (nicheHints.some((term) => lower.includes(term))) base -= 4;

  base += Math.round(estimatedMargin / 4);

  return clamp(base, 20, 95);
}

function calculateCompetitionScore(
  productName: string,
  estimatedMargin: number
): number {
  const lower = normalizeText(productName);
  let base = 66;

  const highCompetitionHints = [
    "ventilador",
    "lanterna",
    "luminária",
    "luminaria",
    "relógio",
    "relogio",
    "umidificador",
    "microfone",
    "fone",
    "suporte",
    "mixer",
  ];

  const lowerCompetitionHints = [
    "geladeira portátil",
    "soundbar",
    "caixa amplificada",
  ];

  if (highCompetitionHints.some((term) => lower.includes(term))) base += 8;
  if (lowerCompetitionHints.some((term) => lower.includes(term))) base -= 6;

  base -= Math.round(estimatedMargin / 6);

  return clamp(base, 20, 95);
}

function calculateOpportunityScore(params: {
  estimatedMargin: number;
  demandScore: number;
  competitionScore: number;
  confidence: number;
}): number {
  const { estimatedMargin, demandScore, competitionScore, confidence } = params;

  return clamp(
    Math.round(
      estimatedMargin * 1.6 +
        demandScore * 0.34 -
        competitionScore * 0.22 +
        (confidence >= 0.8 ? 6 : 0)
    ),
    0,
    100
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

function buildAiSummary(
  riskLevel: CatalogRiskLevel,
  estimatedMargin: number
): string {
  if (riskLevel === "baixo") {
    return "Boa margem estimada e potencial interessante para validação.";
  }

  if (riskLevel === "alto") {
    if (estimatedMargin < 0) {
      return "Margem negativa no cenário atual. Revise antes de comprar.";
    }

    return "Margem apertada ou confiança baixa. Revise antes de comprar.";
  }

  return "Oportunidade intermediária. Vale validar concorrência e preço.";
}

function buildSummary(rows: CatalogAnalysisRow[]): CatalogSummary {
  const totalRows = rows.length;
  const parsedRows = rows.length;

  const promisingCount = rows.filter((r) => r.riskLevel === "baixo").length;
  const reviewCount = rows.filter((r) => r.riskLevel === "moderado").length;
  const riskyCount = rows.filter((r) => r.riskLevel === "alto").length;

  const avgMargin =
    totalRows > 0
      ? round(
          rows.reduce((acc, row) => acc + Number(row.estimatedMargin ?? 0), 0) /
            totalRows
        )
      : 0;

  const avgOpportunity =
    totalRows > 0
      ? round(
          rows.reduce((acc, row) => acc + Number(row.opportunityScore ?? 0), 0) /
            totalRows
        )
      : 0;

  const highlights =
    totalRows > 0
      ? [
          `Produtos válidos: ${totalRows}`,
          `Boas oportunidades: ${promisingCount}`,
          `Revisar: ${reviewCount}`,
          `Margem média estimada: ${avgMargin.toFixed(1)}%`,
          `Melhor oportunidade: ${rows[0]?.productName ?? "-"}`,
        ]
      : ["Nenhum produto válido foi extraído do catálogo."];

  return {
    totalRows,
    parsedRows,
    promisingCount,
    reviewCount,
    riskyCount,
    avgMargin,
    avgOpportunity,
    extractedTextPreview: "",
    highlights,
    usedAI: true,
  };
}

export function analyzeCatalogRows(items: ParsedCatalogRow[]): {
  rows: CatalogAnalysisRow[];
  summary: CatalogSummary;
} {
  const rows: CatalogAnalysisRow[] = items
    .filter((item) => typeof item.supplierCost === "number" && item.supplierCost > 0)
    .map((item) => {
      const supplierCost = round(Number(item.supplierCost ?? 0));
      const confidence = Number(item.confidence ?? 0);

      const mlPriceAvg =
        typeof item.mlPriceAvg === "number" && item.mlPriceAvg > 0
          ? round(item.mlPriceAvg)
          : inferMlPriceAvgFromCost(supplierCost, item.productName);

      const mlPriceMin = round(mlPriceAvg * 0.9);
      const mlPriceMax = round(mlPriceAvg * 1.1);

      const estimatedFees = round(mlPriceAvg * DEFAULT_ML_FEE_RATE);
      const estimatedShipping = round(
        calculateFreightEstimate(mlPriceAvg, item.productName)
      );

      const estimatedProfit = round(
        mlPriceAvg - supplierCost - estimatedFees - estimatedShipping
      );

      const estimatedMargin = round(
        ((estimatedProfit / mlPriceAvg) || 0) * 100
      );

      const demandScore = calculateDemandScore(item.productName, estimatedMargin);
      const competitionScore = calculateCompetitionScore(
        item.productName,
        estimatedMargin
      );

      const opportunityScore = calculateOpportunityScore({
        estimatedMargin,
        demandScore,
        competitionScore,
        confidence,
      });

      const riskLevel = deriveRiskLevel(estimatedMargin, confidence);
      const worthBuying = riskLevel !== "alto" && estimatedMargin >= 12;
      const aiSummary = buildAiSummary(riskLevel, estimatedMargin);

      return {
        ...item,
        supplierCost,
        mlPriceAvg,
        mlPriceMin,
        mlPriceMax,
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
    })
    .sort((a, b) => b.opportunityScore - a.opportunityScore);

  return {
    rows,
    summary: buildSummary(rows),
  };
}