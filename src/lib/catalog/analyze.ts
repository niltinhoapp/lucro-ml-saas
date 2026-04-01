import { extractLikelyPdfText } from "./pdf";
import { extractCatalogItemsWithAI } from "./ai-extractor";
import { validateAndNormalizeCatalogItems } from "./validator";
import { analyzeCatalogRows } from "./analyzer";

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
          "O PDF pode estar em imagem ou exigir OCR.",
        ],
        usedAI: true,
      },
      rows: [],
    };
  }

  const ai = await extractCatalogItemsWithAI({ extractedText: text });
  const validItems = validateAndNormalizeCatalogItems(ai.items);
  const analyzed = analyzeCatalogRows(validItems);

  return {
    fileName,
    mode: analyzed.rows.length ? ("structured" as const) : ("manual_review" as const),
    aiSummary: {
      ...analyzed.summary,
      extractedTextPreview: text.slice(0, 1500),
    },
    rows: analyzed.rows,
  };
}




