import { enrichMlReal } from "./enrich.ml";
import { extractLikelyPdfText } from "./pdf";
import { extractCatalogItemsWithAI } from "./ai-extractor";
import { validateAndNormalizeCatalogItems } from "./validator";
import { analyzeCatalogRows } from "./analyzer";
import type { CatalogAnalysisRow, ParsedCatalogRow } from "./types";

type AnalyzeCatalogResult = {
  fileName: string;
  mode: "structured" | "manual_review";
  aiSummary: {
    totalRows: number;
    parsedRows: number;
    promisingCount: number;
    reviewCount: number;
    riskyCount: number;
    avgMargin: number;
    avgOpportunity: number;
    extractedTextPreview: string;
    highlights: string[];
    usedAI: boolean;
    extractionSource: string;
  };
  rows: CatalogAnalysisRow[];
};

function chunkText(text: string, maxChars = 15000): string[] {
  const clean = text.replace(/\r/g, "").trim();
  if (!clean) return [];

  const chunks: string[] = [];
  for (let i = 0; i < clean.length; i += maxChars) {
    chunks.push(clean.slice(i, i + maxChars));
  }
  return chunks;
}

function dedupe(items: ParsedCatalogRow[]): ParsedCatalogRow[] {
  const map = new Map<string, ParsedCatalogRow>();

  for (const item of items) {
    const key =
      item.sku?.trim().toLowerCase() ||
      `${item.productName?.trim().toLowerCase()}::${item.supplierCost ?? 0}`;

    if (!key) continue;

    if (!map.has(key)) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

function buildSummary(
  rows: CatalogAnalysisRow[],
  text: string,
  chunks: number
) {
  const total = rows.length;

  const promising = rows.filter((r) => r.riskLevel === "baixo").length;
  const risky = rows.filter((r) => r.riskLevel === "alto").length;
  const review = Math.max(total - promising - risky, 0);

  const avgMargin =
    total > 0
      ? rows.reduce((a, r) => a + Number(r.estimatedMargin ?? 0), 0) / total
      : 0;

  const avgScore =
    total > 0
      ? rows.reduce((a, r) => a + Number(r.opportunityScore ?? 0), 0) / total
      : 0;

  const preview = text.replace(/\s+/g, " ").trim().slice(0, 1200);

  return {
    totalRows: total,
    parsedRows: total,
    promisingCount: promising,
    reviewCount: review,
    riskyCount: risky,
    avgMargin: Number(avgMargin.toFixed(1)),
    avgOpportunity: Number(avgScore.toFixed(1)),
    extractedTextPreview: preview || "Nenhum texto legível encontrado.",
    highlights: total
      ? [
          `${promising} oportunidades reais`,
          `${review} precisam validar`,
          `${risky} risco alto`,
          `Chunks processados: ${chunks}`,
        ]
      : ["Nenhum item válido foi encontrado no catálogo."],
    usedAI: true,
    extractionSource: "openai+ml",
  };
}

export async function analyzeCatalogBuffer(
  fileName: string,
  buffer: Buffer
): Promise<AnalyzeCatalogResult> {
  const lower = fileName.toLowerCase();
  let text = "";

  if (lower.endsWith(".pdf")) {
    const extracted = await extractLikelyPdfText(buffer);
    text = extracted.text ?? "";
  } else {
    text = buffer.toString("utf-8");
  }

  if (!text.trim()) {
    return {
      fileName,
      mode: "manual_review",
      aiSummary: {
        totalRows: 0,
        parsedRows: 0,
        promisingCount: 0,
        reviewCount: 0,
        riskyCount: 0,
        avgMargin: 0,
        avgOpportunity: 0,
        extractedTextPreview: "Arquivo sem texto legível.",
        highlights: ["Nenhum conteúdo encontrado."],
        usedAI: false,
        extractionSource: "empty",
      },
      rows: [],
    };
  }

  const chunks = chunkText(text);
  const allItems: ParsedCatalogRow[] = [];

  for (const chunk of chunks) {
    try {
      const res = await extractCatalogItemsWithAI({
        extractedText: chunk,
      });

      if (res.items?.length) {
        allItems.push(...res.items);
      }
    } catch (err) {
      console.error("[catalog] erro IA no chunk:", err);
    }
  }

  const valid = validateAndNormalizeCatalogItems(allItems);
  const unique = dedupe(valid);
  const analyzed = analyzeCatalogRows(unique);

  const enrichedRows = await enrichMlReal(analyzed.rows);
  const summary = buildSummary(enrichedRows, text, chunks.length);

  return {
    fileName,
    mode: enrichedRows.length > 0 ? "structured" : "manual_review",
    aiSummary: summary,
    rows: enrichedRows,
  };
}