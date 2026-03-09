import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

function cleanExtractedText(text: string) {
  return text
    .replace(/\u0000/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractLikelyPdfText(buffer: Buffer): Promise<string> {
  try {
    console.log("[catalog/pdf] iniciando extração com pdf-parse");

    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    const text = cleanExtractedText(parsed.text || "");

    console.log("[catalog/pdf] tamanho texto extraído:", text.length);
    console.log("[catalog/pdf] preview:", text.slice(0, 1200));

    const looksBroken =
      !text ||
      text.length < 40 ||
      text.includes("%PDF-") ||
      /xref|endobj|stream|startxref/i.test(text);

    if (looksBroken) {
      console.log("[catalog/pdf] texto parece inválido ou ilegível");
      return "";
    }

    return text;
  } catch (error) {
    console.error("[catalog/pdf] erro ao extrair texto do PDF:", error);
    return "";
  }
}