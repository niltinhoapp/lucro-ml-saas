import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

function cleanExtractedText(text: string) {
  return text
    .replace(/\u0000/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractLikelyPdfText(buffer: Buffer): Promise<{
  text: string;
  pages: number;
}> {
  const parser = new PDFParse({ data: buffer });
  const parsed = await parser.getText();

  const text = cleanExtractedText(parsed.text || "");
  const pages =
    typeof parsed.total === "number" && parsed.total > 0 ? parsed.total : 0;

  const looksBroken =
    !text ||
    text.length < 40 ||
    text.includes("%PDF-") ||
    /xref|endobj|stream|startxref/i.test(text);

  if (looksBroken) {
    return { text: "", pages };
  }

  return { text, pages };
}



