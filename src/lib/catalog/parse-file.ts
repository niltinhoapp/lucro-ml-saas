import { parsePdfCatalog } from "./parse-pdf";
import { parseCsvCatalog } from "./parce-csv";
import { parseXmlCatalog } from "./parse-xml";

export type ParsedFileKind = "pdf" | "csv" | "xml";

export type ParsedFileResult = {
  kind: ParsedFileKind;
  text: string;
  pages?: number;
  rows?: Record<string, string | number | null>[];
  hasUsableText: boolean;
};

function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop()! : "";
}

export async function parseCatalogFile(
  fileName: string,
  buffer: Buffer
 ): Promise<ParsedFileResult> {
  const ext = getFileExtension(fileName);

  try {
    // ================= PDF =================
    if (ext === "pdf") {
      const result = await parsePdfCatalog(buffer);

      return {
        ...result,
        kind: "pdf",
      };
    }

    // ================= CSV =================
    if (ext === "csv") {
      const result = await parseCsvCatalog(buffer);

      return {
        ...result,
        kind: "csv",
      };
    }

    // ================= XML =================
    if (ext === "xml") {
      const result = await parseXmlCatalog(buffer);

      return {
        ...result,
        kind: "xml",
      };
    }

    // ================= NÃO SUPORTADO =================
    throw new Error(
      "Formato não suportado. Envie arquivos PDF, CSV ou XML."
    );
  } catch (error: any) {
    console.error("[parseCatalogFile] erro:", error);

    return {
      kind: "pdf", // fallback padrão
      text: "",
      hasUsableText: false,
    };
  }
}