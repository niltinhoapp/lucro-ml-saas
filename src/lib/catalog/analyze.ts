import { extractLikelyPdfText } from "./pdf";
import { extractCatalogItemsWithAI } from "./ai-extractor";
import { validateAndNormalizeCatalogItems } from "./validator";
import { analyzeCatalogRows } from "./analyzer";
import type { CatalogAnalysisRow } from "./types";

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
    totalChunks?: number;
  };
  rows: CatalogAnalysisRow[];
};

function chunkText(text: string, maxChars = 18000): string[] {
  const normalized = text.replace(/\r/g, "").trim();

  if (!normalized) {
    return [];
  }

  const chunks: string[] = [];
  let current = "";

  for (const block of normalized.split(/\n\s*\n/g)) {
    const next = current ? `${current}\n\n${block}` : block;

    if (next.length <= maxChars) {
      current = next;
      continue;
    }

    if (current) {
      chunks.push(current);
    }

    if (block.length <= maxChars) {
      current = block;
      continue;
    }

    for (let i = 0; i < block.length; i += maxChars) {
      chunks.push(block.slice(i, i + maxChars));
    }

    current = "";
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

export async function analyzeCatalogBuffer(
  fileName: string,
  buffer: Buffer
): Promise<AnalyzeCatalogResult> {
  const lowerName = fileName.toLowerCase();

  let text = "";

  if (lowerName.endsWith(".pdf")) {
    const extracted = await extractLikelyPdfText(buffer);
    text = extracted.text;
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
        extractedTextPreview:
          "Nenhum texto legível foi extraído deste arquivo.",
        highlights: [
          "Nenhum texto legível foi extraído deste arquivo.",
          "O arquivo pode exigir revisão manual.",
        ],
        usedAI: true,
        extractionSource: "empty",
        totalChunks: 0,
      },
      rows: [],
    };
  }

  const chunks = chunkText(text, 18000);
  const allItems = [];

  for (const chunk of chunks) {
    const extracted = await extractCatalogItemsWithAI({
      extractedText: chunk,
    });

    if (extracted.items.length > 0) {
      allItems.push(...extracted.items);
    }
  }

  const validItems = validateAndNormalizeCatalogItems(allItems);
  const analyzed = analyzeCatalogRows(validItems);

  return {
    fileName,
    mode: analyzed.rows.length > 0 ? "structured" : "manual_review",
    aiSummary: {
      ...analyzed.summary,
      extractedTextPreview: text.slice(0, 1500),
      totalChunks: chunks.length,
      usedAI: true,
      extractionSource: "openai",
      highlights:
        Array.isArray(analyzed.summary.highlights) &&
        analyzed.summary.highlights.length > 0
          ? analyzed.summary.highlights
          : [
              "Estruturação concluída com apoio de IA.",
              `Chunks processados: ${chunks.length}`,
              `Itens válidos após normalização: ${validItems.length}`,
            ],
    },
    rows: analyzed.rows,
  };
}