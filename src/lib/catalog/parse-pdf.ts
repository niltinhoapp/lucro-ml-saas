import { extractLikelyPdfText } from "./pdf";

type ParsePdfCatalogResult = {
  kind: "pdf";
  text: string;
  pages?: number;
  hasUsableText: boolean;
};

function normalizePdfText(input: string): string {
  return (input || "")
    .replace(/\r/g, "\n")
    .replace(/\u0000/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function looksLikeGarbagePdfText(text: string): boolean {
  if (!text) return true;

  const garbageSignals = [
    "%PDF",
    "endobj",
    "xref",
    "stream",
    "endstream",
    "/Type",
    "/Catalog",
    "/Pages",
    "/Font",
  ];

  const matchedSignals = garbageSignals.filter((signal) =>
    text.includes(signal)
  ).length;

  return matchedSignals >= 3;
}

function hasEnoughReadableContent(text: string): boolean {
  if (!text) return false;
  if (text.length < 80) return false;
  if (!/[a-zA-ZÀ-ÿ]/.test(text)) return false;
  if (!/\d/.test(text)) return false;
  return true;
}

function hasCatalogLikePatterns(text: string): boolean {
  if (!text) return false;

  const patterns = [
    /\b\d{1,3}(?:\.\d{3})*,\d{2}\b/, // preço BR
    /\bsku\b/i,
    /\bc[oó]d(?:igo)?\b/i,
    /\brefer[eê]ncia\b/i,
    /\bean\b/i,
    /\bmarca\b/i,
    /\bproduto\b/i,
    /\bcaixa\b/i,
    /\bkit\b/i,
    /\buni(?:dade|d)?\b/i,
  ];

  return patterns.some((pattern) => pattern.test(text));
}

export async function parsePdfCatalog(
  buffer: Buffer
): Promise<ParsePdfCatalogResult> {
  try {
    const { text, pages } = await extractLikelyPdfText(buffer);

    const cleaned = normalizePdfText(text || "");

    const garbage = looksLikeGarbagePdfText(cleaned);
    const readable = hasEnoughReadableContent(cleaned);
    const catalogLike = hasCatalogLikePatterns(cleaned);

    const hasUsableText = !garbage && readable && (catalogLike || cleaned.length > 300);

    return {
      kind: "pdf",
      text: cleaned,
      pages,
      hasUsableText,
    };
  } catch (error) {
    console.error("[parsePdfCatalog] erro ao ler PDF:", error);

    return {
      kind: "pdf",
      text: "",
      hasUsableText: false,
    };
  }
}