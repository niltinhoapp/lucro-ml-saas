import type {
  CatalogAnalysisRow,
  CatalogRiskLevel,
  CatalogSummary,
  ParsedCatalogRow,
} from "./types";

const DEFAULT_ML_FEE_RATE = 0.16;

function inferMlPriceAvgFromCost(
  supplierCost: number,
  productName: string
): number {
  const lower = productName.toLowerCase();

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
  ];

  const isLowTicket = lowTicketHints.some((term) => lower.includes(term));
  const markup = isLowTicket ? 1.75 : 1.9;

  return Number((supplierCost * markup).toFixed(2));
}

function calculateFreightEstimate(
  mlPriceAvg: number,
  productName: string
): number {
  const lower = productName.toLowerCase();

  const bulkyHints = [
    "patinete",
    "bicicleta",
    "caixa de som",
    "mesa",
    "moving",
    "máquina de fumaça",
    "maquina de fumaça",
    "maquina de fumaca",
  ];

  if (bulkyHints.some((term) => lower.includes(term))) {
    return mlPriceAvg < 200 ? 25 : 40;
  }

  if (mlPriceAvg < 79) return 12;
  if (mlPriceAvg < 150) return 18;
  return 25;
}

function calculateDemandScore(
  productName: string,
  estimatedMargin: number
): number {
  const lower = productName.toLowerCase();
  let base = 58;

  const highDemandHints = [
    "ventilador",
    "lanterna",
    "luminária",
    "luminaria",
    "relógio",
    "relogio",
    "umidificador",
    "filtro de linha",
    "plug",
    "adaptador",
  ];

  const nicheHints = [
    "moving",
    "dmx",
    "filamento",
    "poker",
    "dominó",
    "domino",
    "peeling",
    "irrigador",
  ];

  if (highDemandHints.some((term) => lower.includes(term))) base += 10;
  if (nicheHints.some((term) => lower.includes(term))) base -= 4;

  base += Math.round(estimatedMargin / 3);

  return Math.max(20, Math.min(95, base));
}

function calculateCompetitionScore(
  productName: string,
  estimatedMargin: number
): number {
  const lower = productName.toLowerCase();
  let base = 68;

  const highCompetitionHints = [
    "ventilador",
    "lanterna",
    "luminária",
    "luminaria",
    "relógio",
    "relogio",
    "umidificador",
  ];

  const lowerCompetitionHints = [
    "moving",
    "dmx",
    "filamento",
    "maquina de fumaça",
    "maquina de fumaca",
  ];

  if (highCompetitionHints.some((term) => lower.includes(term))) base += 8;
  if (lowerCompetitionHints.some((term) => lower.includes(term))) base -= 6;

  base -= Math.round(estimatedMargin / 5);

  return Math.max(20, Math.min(95, base));
}

export function analyzeCatalogRows(items: ParsedCatalogRow[]): {
  rows: CatalogAnalysisRow[];
  summary: CatalogSummary;
} {
  const rows: CatalogAnalysisRow[] = items
    .filter((item) => item.supplierCost !== null && item.supplierCost > 0)
    .map((item) => {
      const supplierCost = Number(item.supplierCost!.toFixed(2));
      const mlPriceAvg = inferMlPriceAvgFromCost(supplierCost, item.productName);
      const mlPriceMin = Number((mlPriceAvg * 0.9).toFixed(2));
      const mlPriceMax = Number((mlPriceAvg * 1.1).toFixed(2));
      const estimatedFees = Number(
        (mlPriceAvg * DEFAULT_ML_FEE_RATE).toFixed(2)
      );
      const estimatedShipping = Number(
        calculateFreightEstimate(mlPriceAvg, item.productName).toFixed(2)
      );
      const estimatedProfit = Number(
        (mlPriceAvg - supplierCost - estimatedFees - estimatedShipping).toFixed(
          2
        )
      );
      const estimatedMargin = Number(
        (((estimatedProfit / mlPriceAvg) || 0) * 100).toFixed(2)
      );

      const demandScore = calculateDemandScore(item.productName, estimatedMargin);
      const competitionScore = calculateCompetitionScore(
        item.productName,
        estimatedMargin
      );

      const opportunityScore = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            estimatedMargin * 1.6 +
              demandScore * 0.34 -
              competitionScore * 0.22 +
              (item.confidence >= 0.8 ? 6 : 0)
          )
        )
      );

      let riskLevel: CatalogRiskLevel = "moderado";
      if (estimatedMargin >= 22 && item.confidence >= 0.8) riskLevel = "baixo";
      if (estimatedMargin < 10 || item.confidence < 0.55) riskLevel = "alto";

      const worthBuying = riskLevel !== "alto" && estimatedMargin >= 12;

      let aiSummary =
        "Oportunidade intermediária. Vale validar concorrência e preço.";

      if (riskLevel === "baixo") {
        aiSummary =
          "Boa margem estimada e potencial interessante para validação.";
      } else if (riskLevel === "alto") {
        aiSummary =
          "Margem apertada ou confiança baixa. Revise antes de comprar.";
      }

      return {
        sku: item.sku,
        model: item.model,
        brand: item.brand,
        category: item.category,
        productName: item.productName,
        supplierCost,
        unitPrice: item.unitPrice,
        boxPrice: item.boxPrice,
        unitsPerBox: item.unitsPerBox,
        specs: item.specs,
        notes: item.notes,
        riskLevel,
        worthBuying,
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
        aiSummary,
      };
    })
    .sort((a, b) => b.opportunityScore - a.opportunityScore);

  const promisingCount = rows.filter((r) => r.riskLevel === "baixo").length;
  const reviewCount = rows.filter((r) => r.riskLevel === "moderado").length;
  const riskyCount = rows.filter((r) => r.riskLevel === "alto").length;

  const avgMargin = rows.length
    ? Number(
        (
          rows.reduce((acc, row) => acc + row.estimatedMargin, 0) / rows.length
        ).toFixed(2)
      )
    : 0;

  const avgOpportunity = rows.length
    ? Number(
        (
          rows.reduce((acc, row) => acc + row.opportunityScore, 0) /
          rows.length
        ).toFixed(2)
      )
    : 0;

  const summary: CatalogSummary = {
    totalRows: items.length,
    parsedRows: rows.length,
    promisingCount,
    reviewCount,
    riskyCount,
    avgMargin,
    avgOpportunity,
    extractedTextPreview: "",
    highlights: rows.length
      ? [
          `Produtos válidos: ${rows.length}`,
          `Boas oportunidades: ${promisingCount}`,
          `Margem média estimada: ${avgMargin.toFixed(1)}%`,
          `Melhor oportunidade: ${rows[0]?.productName ?? "-"}`,
        ]
      : ["Nenhum produto válido foi extraído do catálogo."],
    usedAI: true,
  };

  return { rows, summary };
}

