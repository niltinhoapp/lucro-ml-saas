import type { ParsedCatalogRow } from "./types";
import { extractCatalogItemsWithAI } from "./ai-extractor";
import { analyzeCatalogRows } from "./analyzer";
import { extractCatalogItemsFallback } from "./fallback-extractor";
import { parseCatalogFile } from "./parse-file";
import { validateAndNormalizeCatalogItems } from "./validator";

type AnalyzeCatalogMode = "structured" | "manual_review";

type AnalyzeCatalogSummary = {
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
  inputTokens?: number;
  outputTokens?: number;
  cached?: boolean;
};

type AnalyzeCatalogResult = {
  fileName: string;
  mode: AnalyzeCatalogMode;
  aiSummary: AnalyzeCatalogSummary;
  rows: ReturnType<typeof analyzeCatalogRows>["rows"];
};

function buildEmptySummary(params: {
  parsedKind: "pdf" | "csv" | "xml";
  message?: string;
}): AnalyzeCatalogSummary {
  const baseMessage =
    params.message || "Nenhum texto legível foi extraído deste arquivo.";

  return {
    totalRows: 0,
    parsedRows: 0,
    promisingCount: 0,
    reviewCount: 0,
    riskyCount: 0,
    avgMargin: 0,
    avgOpportunity: 0,
    extractedTextPreview: baseMessage,
    highlights: [
      baseMessage,
      params.parsedKind === "pdf"
        ? "O PDF pode estar em imagem, protegido ou sem texto selecionável."
        : "O arquivo não trouxe conteúdo legível suficiente para análise.",
    ],
    usedAI: false,
  };
}

function normalizeHighlights(values: unknown[]): string[] {
  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function buildParseHighlights(parsed: Awaited<ReturnType<typeof parseCatalogFile>>) {
  const highlights: string[] = [
    `Arquivo interpretado como ${parsed.kind.toUpperCase()}.`,
  ];

  if (parsed.kind === "pdf" && parsed.pages) {
    highlights.push(`Páginas lidas no PDF: ${parsed.pages}.`);
  }

  if (parsed.kind === "csv" && parsed.rows?.length) {
    highlights.push(`Linhas detectadas no CSV: ${parsed.rows.length}.`);
  }

  if (parsed.kind === "xml" && parsed.rows?.length) {
    highlights.push(`Registros detectados no XML: ${parsed.rows.length}.`);
  }

  return highlights;
}

function shouldMergeParsedRows(
  parsedRows: Record<string, string | number | null>[] | undefined
): boolean {
  return Array.isArray(parsedRows) && parsedRows.length > 0;
}

function parsedRowsToCatalogItems(
  rows: Record<string, string | number | null>[]
): ParsedCatalogRow[] {
  const items = rows
    .map((row): ParsedCatalogRow | null => {
      const sku =
        typeof row.sku === "string"
          ? row.sku
          : typeof row.codigo === "string"
          ? row.codigo
          : null;

      const productName =
        typeof row.nome === "string"
          ? row.nome
          : typeof row.product_name === "string"
          ? row.product_name
          : typeof row.descricao === "string"
          ? row.descricao
          : typeof row.name === "string"
          ? row.name
          : null;

      const brand =
        typeof row.marca === "string"
          ? row.marca
          : typeof row.brand === "string"
          ? row.brand
          : null;

      const category =
        typeof row.categoria === "string"
          ? row.categoria
          : typeof row.category === "string"
          ? row.category
          : null;

      const unitPrice =
        typeof row.custo === "number"
          ? row.custo
          : typeof row.unit_price === "number"
          ? row.unit_price
          : typeof row.price === "number"
          ? row.price
          : null;

      const unitsPerBox =
        typeof row.quantidade === "number"
          ? Math.floor(row.quantidade)
          : typeof row.units_per_box === "number"
          ? Math.floor(row.units_per_box)
          : null;

      if (!productName || !String(productName).trim()) {
        return null;
      }

      return {
        sku: sku ? String(sku) : null,
        model: sku ? String(sku) : null,
        brand: brand ? String(brand) : null,
        category: category ? String(category) : null,
        productName: String(productName),
        supplierCost:
          typeof unitPrice === "number" && unitPrice > 0 ? unitPrice : null,
        unitPrice:
          typeof unitPrice === "number" && unitPrice > 0 ? unitPrice : null,
        boxPrice: null,
        unitsPerBox: unitsPerBox && unitsPerBox > 0 ? unitsPerBox : null,
        specs: [],
        notes: "Item originado da estrutura do arquivo.",
        confidence: 0.72,
      };
    })
    .filter((item): item is ParsedCatalogRow => item !== null);

  return items;
}

export async function analyzeCatalogBuffer(
  fileName: string,
  buffer: Buffer
): Promise<AnalyzeCatalogResult> {
  const parsed = await parseCatalogFile(fileName, buffer);

  if (!parsed.hasUsableText || !parsed.text.trim()) {
    return {
      fileName,
      mode: "manual_review",
      aiSummary: buildEmptySummary({ parsedKind: parsed.kind }),
      rows: [],
    };
  }

  let extractedItems: ParsedCatalogRow[] = [];
  let usedAI = false;
  let inputTokens: number | undefined;
  let outputTokens: number | undefined;
  let cached: boolean | undefined;
  const extractionNotes: string[] = [];

  try {
    const aiResult = await extractCatalogItemsWithAI({
      extractedText: parsed.text,
    });

    extractedItems = Array.isArray(aiResult?.items) ? aiResult.items : [];
    usedAI = extractedItems.length > 0;
    inputTokens = aiResult.inputTokens;
    outputTokens = aiResult.outputTokens;
    cached = aiResult.cached;

    if (!extractedItems.length) {
      extractionNotes.push(
        "A IA não retornou itens válidos. Aplicado fallback local."
      );
      extractedItems = extractCatalogItemsFallback(parsed.text);
      usedAI = false;
    }
  } catch (error) {
    console.error("[analyzeCatalogBuffer] erro na IA, usando fallback:", error);
    extractionNotes.push("Falha na extração com IA. Aplicado fallback local.");
    extractedItems = extractCatalogItemsFallback(parsed.text);
    usedAI = false;
  }

  if (!extractedItems.length && shouldMergeParsedRows(parsed.rows)) {
    extractionNotes.push(
      "Usando estrutura interna do arquivo como apoio à extração."
    );
    extractedItems = parsedRowsToCatalogItems(parsed.rows!);
  }

  const validItems = validateAndNormalizeCatalogItems(extractedItems);
  const analyzed = analyzeCatalogRows(validItems);

  const highlights = normalizeHighlights([
    ...(analyzed.summary?.highlights ?? []),
    ...buildParseHighlights(parsed),
    ...extractionNotes,
    cached ? "Resultado reaproveitado do cache de IA." : "",
  ]);

  return {
    fileName,
    mode: analyzed.rows.length ? "structured" : "manual_review",
    aiSummary: {
      ...analyzed.summary,
      extractedTextPreview: parsed.text.slice(0, 1500),
      highlights,
      usedAI,
      inputTokens,
      outputTokens,
      cached,
    },
    rows: analyzed.rows,
  };
}