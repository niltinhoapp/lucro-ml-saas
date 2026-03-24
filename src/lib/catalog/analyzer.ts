import type {
  CatalogAnalysisRow,
  CatalogRiskLevel,
  CatalogSummary,
  ParsedCatalogRow,
} from "./types";

const ML_FEE = 0.16;

/* ================= HELPERS ================= */

function normalize(name: string) {
  return name.toLowerCase();
}

/* ================= PREÇO ================= */

function estimateSellingPrice(cost: number, name: string): number {
  const lower = normalize(name);

  const cheap = ["lanterna", "plug", "adaptador", "cabo"];
  const medium = ["ventilador", "umidificador", "ring light"];

  let markup = 2;

  if (cheap.some((t) => lower.includes(t))) markup = 1.7;
  else if (medium.some((t) => lower.includes(t))) markup = 1.85;

  return Number((cost * markup).toFixed(2));
}

/* ================= FRETE ================= */

function estimateShipping(price: number, name: string): number {
  const lower = normalize(name);

  const bulky = ["bicicleta", "mesa", "patinete", "caixa de som"];

  if (bulky.some((t) => lower.includes(t))) {
    return price < 200 ? 30 : 45;
  }

  if (price < 79) return 12;
  if (price < 150) return 18;
  return 25;
}

/* ================= DEMANDA ================= */

function demandScore(name: string, margin: number) {
  const lower = normalize(name);

  let score = 55;

  const high = [
    "ventilador",
    "lanterna",
    "ring light",
    "adaptador",
    "plug",
  ];

  const niche = ["dmx", "moving", "profissional"];

  if (high.some((t) => lower.includes(t))) score += 12;
  if (niche.some((t) => lower.includes(t))) score -= 5;

  score += Math.round(margin / 3);

  return Math.max(20, Math.min(95, score));
}

/* ================= CONCORRÊNCIA ================= */

function competitionScore(name: string, margin: number) {
  const lower = normalize(name);

  let score = 70;

  const saturated = ["ventilador", "lanterna", "umidificador"];
  const low = ["moving", "dmx", "especial"];

  if (saturated.some((t) => lower.includes(t))) score += 10;
  if (low.some((t) => lower.includes(t))) score -= 8;

  score -= Math.round(margin / 5);

  return Math.max(20, Math.min(95, score));
}

/* ================= CORE ================= */

export function analyzeCatalogRows(items: ParsedCatalogRow[]): {
  rows: CatalogAnalysisRow[];
  summary: CatalogSummary;
} {
  const rows: CatalogAnalysisRow[] = items
    .filter((item) => item.supplierCost && item.supplierCost > 0)
    .map((item) => {
      const cost = Number(item.supplierCost!.toFixed(2));

      const mlPriceAvg = estimateSellingPrice(cost, item.productName);
      const mlPriceMin = Number((mlPriceAvg * 0.9).toFixed(2));
      const mlPriceMax = Number((mlPriceAvg * 1.1).toFixed(2));

      const fees = Number((mlPriceAvg * ML_FEE).toFixed(2));
      const shipping = Number(
        estimateShipping(mlPriceAvg, item.productName).toFixed(2)
      );

      const profit = Number(
        (mlPriceAvg - cost - fees - shipping).toFixed(2)
      );

      const margin = Number(
        ((profit / mlPriceAvg) * 100).toFixed(2)
      );

      const demand = demandScore(item.productName, margin);
      const competition = competitionScore(item.productName, margin);

      const opportunity = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            margin * 1.8 +
              demand * 0.4 -
              competition * 0.25 +
              (item.confidence >= 0.8 ? 8 : 0)
          )
        )
      );

      /* ================= RISCO ================= */

      let risk: CatalogRiskLevel = "moderado";

      if (margin >= 25 && item.confidence >= 0.8) {
        risk = "baixo";
      } else if (margin < 10 || item.confidence < 0.5) {
        risk = "alto";
      }

      const worthBuying =
        risk === "baixo" && margin >= 15 && opportunity >= 60;

      /* ================= RESUMO ================= */

      let summary = "Produto precisa de validação manual.";

      if (risk === "baixo") {
        summary = "Boa oportunidade com margem e potencial.";
      } else if (risk === "alto") {
        summary = "Risco alto. Evitar compra sem validação.";
      }

      if (margin > 30) {
        summary = "Alta margem. Forte candidato para teste imediato.";
      }

      if (competition > 85) {
        summary += " Concorrência muito alta.";
      }

      return {
        sku: item.sku,
        model: item.model,
        brand: item.brand,
        category: item.category,
        productName: item.productName,
        supplierCost: cost,
        unitPrice: item.unitPrice,
        boxPrice: item.boxPrice,
        unitsPerBox: item.unitsPerBox,
        specs: item.specs,
        notes: item.notes,
        riskLevel: risk,
        worthBuying,
        mlPriceAvg,
        mlPriceMin,
        mlPriceMax,
        estimatedFees: fees,
        estimatedShipping: shipping,
        estimatedProfit: profit,
        estimatedMargin: margin,
        demandScore: demand,
        competitionScore: competition,
        opportunityScore: opportunity,
        aiSummary: summary,
      };
    })
    .sort((a, b) => b.opportunityScore - a.opportunityScore);

  /* ================= SUMMARY ================= */

  const promising = rows.filter((r) => r.riskLevel === "baixo").length;
  const review = rows.filter((r) => r.riskLevel === "moderado").length;
  const risky = rows.filter((r) => r.riskLevel === "alto").length;

  const avgMargin = rows.length
    ? Number(
        (rows.reduce((a, r) => a + r.estimatedMargin, 0) / rows.length).toFixed(
          2
        )
      )
    : 0;

  const avgOpportunity = rows.length
    ? Number(
        (
          rows.reduce((a, r) => a + r.opportunityScore, 0) /
          rows.length
        ).toFixed(2)
      )
    : 0;

  const summary: CatalogSummary = {
    totalRows: items.length,
    parsedRows: rows.length,
    promisingCount: promising,
    reviewCount: review,
    riskyCount: risky,
    avgMargin,
    avgOpportunity,
    extractedTextPreview: "",
    highlights: rows.length
      ? [
          `Produtos válidos: ${rows.length}`,
          `Oportunidades boas: ${promising}`,
          `Margem média: ${avgMargin}%`,
          `Top produto: ${rows[0]?.productName || "-"}`,
        ]
      : ["Nenhum produto válido encontrado."],
    usedAI: true,
  };

  return { rows, summary };
}