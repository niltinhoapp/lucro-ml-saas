import { extractLikelyPdfText } from "./pdf";
import { extractCatalogItemsWithAI } from "./ai-extractor";
import { validateAndNormalizeCatalogItems } from "./validator";
import { analyzeCatalogRows } from "./analyzer";
import type { ParsedCatalogRow } from "./types";

function chunkText(text: string, maxChars = 18000) {
  const normalized = text.replace(/\r/g, "").trim();
  if (!normalized) return [];

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
) {
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
      mode: "manual_review" as const,
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
      },
      rows: [],
    };
  }

  const chunks = chunkText(text, 18000);

  const allItems: ParsedCatalogRow[] = [];

  for (const chunk of chunks) {
    const ai = await extractCatalogItemsWithAI({ extractedText: chunk });
    if (Array.isArray(ai?.items)) {
      allItems.push(...ai.items);
    }
  }

  const validItems = validateAndNormalizeCatalogItems(allItems);
  const analyzed = analyzeCatalogRows(validItems);

  return {
    fileName,
    mode: analyzed.rows.length
      ? ("structured" as const)
      : ("manual_review" as const),
    aiSummary: {
      ...analyzed.summary,
      extractedTextPreview: text.slice(0, 1500),
      totalChunks: chunks.length,
    },
    rows: analyzed.rows,
  };
}