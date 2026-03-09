import { extractLikelyPdfText } from "./pdf";
import { extractCatalogItemsWithAI } from "./ai-structure";

export type CatalogRow = {
  productName: string;
  supplierCost: number;
  avgMlPrice: number;
  estimatedMargin: number;
  demandScore: number;
  competitionScore: number;
  opportunityScore: number;
  riskLevel: "baixo" | "moderado" | "alto";
  aiSummary: string;
};

export type CatalogSummary = {
  totalRows: number;
  parsedRows: number;
  promisingCount: number;
  reviewCount: number;
  riskyCount: number;
  avgMargin: number;
  avgOpportunity: number;
  extractionQuality: "alta" | "media" | "baixa";
  extractedTextPreview: string;
  highlights: string[];
};

export type CatalogAnalysisResult = {
  fileName: string;
  mode: "structured" | "manual_review";
  summary: CatalogSummary;
  rows: CatalogRow[];
};

type BaseCatalogRow = {
  sku: string | null;
  productName: string;
  supplierCost: number;
};

function cleanLine(line: string) {
  return line
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/[•·▪■]/g, " ")
    .trim();
}

function looksLikeGarbage(text: string) {
  if (!text) return true;
  const sample = text.slice(0, 1500);

  return (
    sample.includes("%PDF-") ||
    /xref|endobj|stream|startxref|obj\b/i.test(sample)
  );
}

function safePreviewText(text: string) {
  if (!text || looksLikeGarbage(text)) {
    return "Não foi possível extrair texto legível deste PDF nesta etapa. Esse arquivo pode ser escaneado, baseado em imagem ou usar um layout fechado.";
  }

  return text.slice(0, 1200);
}

function isSkuLine(line: string) {
  return /^[A-Z]{1,4}(?:-[A-Z0-9]{2,8}){1,4}$/i.test(line.trim());
}

function normalizePrice(value: string) {
  const raw = value.replace(/[R$\s]/gi, "").trim();

  if (/^\d+\.\d{2}$/.test(raw)) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }

  const cleaned = raw
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function extractPrice(line: string): number | null {
  const match = line.match(/R\$\s*([0-9]+(?:[.,][0-9]{2})?)/i);
  if (!match) return null;

  const n = normalizePrice(match[1]);
  return n > 0 ? n : null;
}

function isNoiseLine(line: string) {
  const l = line.trim().toLowerCase();

  if (!l) return true;
  if (/^--\s*\d+\s+of\s+\d+\s*--$/.test(l)) return true;
  if (/^categorias de produtos/.test(l)) return true;
  if (/^voltar ao in[ií]cio/.test(l)) return true;
  if (/^acesse /.test(l)) return true;
  if (/^www\./.test(l)) return true;
  if (/^saiba mais$/.test(l)) return true;
  if (/^acima de \d+ caixas?$/.test(l)) return true;
  if (/^comprando \d+ caixas?$/.test(l)) return true;
  if (/^unid\.?\s*cx/.test(l)) return true;
  if (/^pcs\/cx/.test(l)) return true;
  if (/^r\$\s*\d/.test(l)) return true;
  if (/^[0-9]{2}\/[0-9]{2}$/.test(l)) return true;
  if (/^@/.test(l)) return true;
  if (/^#/.test(l)) return true;

  if (
    /(pot[êe]ncia|voltagem|bateria|capacidade|dimens[õo]es|material|entrada|sa[íi]da|tens[aã]o|led\b|dist[âa]ncia|tempo de uso|lateral|frontal|imped[âa]ncia|frequ[êe]ncia)/i.test(
      l
    )
  ) {
    return true;
  }

  return false;
}

function isValidProductName(name: string) {
  const n = cleanLine(name);

  if (!n) return false;
  if (n.length < 6) return false;
  if (!/[a-záàâãéèêíìîóòôõúùûç]/i.test(n)) return false;

  const lower = n.toLowerCase();

  if (isNoiseLine(lower)) return false;
  if (/^saiba mais$/i.test(n)) return false;
  if (/^www\./i.test(n)) return false;
  if (/^acima de \d+ caixas?$/i.test(n)) return false;
  if (/^comprando \d+ caixas?$/i.test(n)) return false;
  if (/^r\$\s*\d/i.test(n)) return false;

  return true;
}

function fallbackRegexParser(text: string): BaseCatalogRow[] {
  console.log("[catalog] usando fallbackRegexParser");

  if (!text || !text.trim()) return [];

  const lines = text.split(/\r?\n/).map(cleanLine).filter(Boolean);
  const rows: BaseCatalogRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const price = extractPrice(line);

    if (price === null) continue;

    let sku: string | null = null;
    let productName: string | null = null;

    for (let j = i - 1; j >= Math.max(0, i - 6); j--) {
      const prev = lines[j];
      if (isNoiseLine(prev)) continue;

      if (!sku && isSkuLine(prev)) {
        sku = prev;
        continue;
      }

      if (!productName && isValidProductName(prev)) {
        productName = prev;
      }

      if (sku && productName) break;
    }

    if (!sku || !productName) {
      continue;
    }

    rows.push({
      sku,
      productName: `${sku} - ${productName}`,
      supplierCost: price,
    });
  }

  const deduped = new Map<string, BaseCatalogRow>();
  for (const row of rows) {
    const key = `${(row.sku || "").toLowerCase()}::${row.supplierCost.toFixed(2)}`;
    if (!deduped.has(key)) deduped.set(key, row);
  }

  return Array.from(deduped.values());
}

function sanitizeBaseRows(rows: BaseCatalogRow[]) {
  return rows.filter((row) => {
    if (!row.sku || !isSkuLine(row.sku)) return false;
    if (!isValidProductName(row.productName)) return false;
    if (!Number.isFinite(row.supplierCost) || row.supplierCost <= 0) return false;
    return true;
  });
}

function enrichRow(row: BaseCatalogRow): CatalogRow {
  const supplierCost = Number(row.supplierCost || 0);

  const avgMlPrice = Number((supplierCost * 1.9).toFixed(2));
  const estimatedFees = avgMlPrice * 0.16;
  const estimatedShipping = avgMlPrice < 79 ? 12 : 18;
  const estimatedProfit =
    avgMlPrice - supplierCost - estimatedFees - estimatedShipping;
  const estimatedMargin =
    avgMlPrice > 0 ? (estimatedProfit / avgMlPrice) * 100 : 0;

  const demandScore = Math.max(20, Math.min(95, Math.round(55 + estimatedMargin)));
  const competitionScore = Math.max(
    20,
    Math.min(95, Math.round(80 - estimatedMargin / 1.5))
  );
  const opportunityScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        estimatedMargin * 1.8 + demandScore * 0.35 - competitionScore * 0.22
      )
    )
  );

  let riskLevel: "baixo" | "moderado" | "alto" = "moderado";
  if (estimatedMargin >= 22) riskLevel = "baixo";
  else if (estimatedMargin < 10) riskLevel = "alto";

  let aiSummary = "Item em revisão automática.";
  if (riskLevel === "baixo") {
    aiSummary = "Boa margem estimada e potencial interessante para validação.";
  } else if (riskLevel === "alto") {
    aiSummary =
      "Margem apertada. Vale revisar preço, taxa e frete antes da compra.";
  } else {
    aiSummary =
      "Oportunidade intermediária. Pode funcionar melhor com ajuste de preço.";
  }

  return {
    productName: row.productName,
    supplierCost: Number(supplierCost.toFixed(2)),
    avgMlPrice: Number(avgMlPrice.toFixed(2)),
    estimatedMargin: Number(estimatedMargin.toFixed(1)),
    demandScore,
    competitionScore,
    opportunityScore,
    riskLevel,
    aiSummary,
  };
}

function buildHighlights(rows: CatalogRow[], aiUnavailable = false): string[] {
  if (!rows.length) {
    return aiUnavailable
      ? [
          "A leitura inteligente do catálogo não pôde ser concluída nesta tentativa.",
          "Revise a quota da API ou envie o catálogo para revisão manual.",
        ]
      : [
          "Nenhum item estruturado foi identificado automaticamente.",
          "Revise a qualidade do PDF ou tente outro arquivo.",
        ];
  }

  const ordered = [...rows].sort((a, b) => b.opportunityScore - a.opportunityScore);
  const top = ordered[0];
  const lowRisk = rows.filter((row) => row.riskLevel === "baixo").length;
  const highRisk = rows.filter((row) => row.riskLevel === "alto").length;

  const highlights = [
    `Itens lidos: ${rows.length}.`,
    `Itens com risco baixo: ${lowRisk}.`,
    `Itens com risco alto: ${highRisk}.`,
  ];

  if (top) {
    highlights.push(
      `Melhor oportunidade inicial: ${top.productName} com score ${top.opportunityScore} e margem estimada de ${top.estimatedMargin.toFixed(1)}%.`
    );
  }

  return highlights;
}

export async function analyzeCatalogBuffer(
  fileName: string,
  buffer: Buffer
): Promise<CatalogAnalysisResult> {
  console.log("==================================================");
  console.log("[catalog] analyzeCatalogBuffer iniciado");
  console.log("[catalog] fileName:", fileName);
  console.log("[catalog] buffer.length:", buffer?.length ?? 0);

  const lowerName = fileName.toLowerCase();
  let text = "";
  let aiUnavailable = false;

  try {
    if (lowerName.endsWith(".pdf")) {
      console.log("[catalog] tipo detectado: PDF");
      text = await extractLikelyPdfText(buffer);
    } else {
      console.log("[catalog] tipo detectado: texto simples");
      text = buffer.toString("utf-8");
    }
  } catch (error) {
    console.error("[catalog] erro ao extrair texto:", error);
    text = "";
  }

  console.log("[catalog] tamanho do texto extraído:", text.length);
  console.log("[catalog] preview bruto do texto:");
  console.log(text.slice(0, 2000));
  console.log("[catalog] fim preview bruto");

  const totalRows = text.split(/\r?\n/).filter(Boolean).length;

  let parsedBaseRows: BaseCatalogRow[] = [];

  try {
    parsedBaseRows = (await extractCatalogItemsWithAI(text)).map((item) => ({
      sku: item.sku,
      productName: item.sku
        ? `${item.sku} - ${item.productName}`
        : item.productName,
      supplierCost: item.supplierCost,
    }));
  } catch (error) {
    console.error("[catalog] erro na estruturação por IA:", error);
    aiUnavailable = true;
    parsedBaseRows = [];
  }

  parsedBaseRows = sanitizeBaseRows(parsedBaseRows);

  if (!parsedBaseRows.length) {
    const fallbackRows = sanitizeBaseRows(fallbackRegexParser(text));

    console.log("[catalog] fallbackRows válidas:", fallbackRows.length);

    const goodEnough =
      fallbackRows.length >= 5 &&
      fallbackRows.length <= 120;

    parsedBaseRows = goodEnough ? fallbackRows : [];
  }

  console.log("[catalog] total de rows base:", parsedBaseRows.length);
  console.log("[catalog] preview rows base:", parsedBaseRows.slice(0, 20));

  const rows = parsedBaseRows.map(enrichRow);

  const promisingCount = rows.filter((row) => row.riskLevel === "baixo").length;
  const reviewCount = rows.filter((row) => row.riskLevel === "moderado").length;
  const riskyCount = rows.filter((row) => row.riskLevel === "alto").length;

  const avgMargin = rows.length
    ? rows.reduce((acc, row) => acc + row.estimatedMargin, 0) / rows.length
    : 0;

  const avgOpportunity = rows.length
    ? rows.reduce((acc, row) => acc + row.opportunityScore, 0) / rows.length
    : 0;

  const extractionQuality: "alta" | "media" | "baixa" =
    rows.length >= 8 ? "alta" : rows.length >= 3 ? "media" : "baixa";

  const result: CatalogAnalysisResult = {
    fileName,
    mode: rows.length ? "structured" : "manual_review",
    summary: {
      totalRows,
      parsedRows: rows.length,
      promisingCount,
      reviewCount,
      riskyCount,
      avgMargin: Number(avgMargin.toFixed(1)),
      avgOpportunity: Number(avgOpportunity.toFixed(1)),
      extractionQuality,
      extractedTextPreview: safePreviewText(text),
      highlights: buildHighlights(rows, aiUnavailable),
    },
    rows: rows.sort((a, b) => b.opportunityScore - a.opportunityScore),
  };

  console.log("[catalog] resultado final summary:", result.summary);
  console.log("[catalog] analyzeCatalogBuffer finalizado");
  console.log("==================================================");

  return result;
}