import { z } from "zod";
import type { ParsedCatalogRow } from "./types";
import { getCatalogAiCache, saveCatalogAiCache } from "@/server/catalog/cache";
import { sha256String } from "@/lib/catalog/hash";

const CACHE_VERSION = "v3";
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const DEFAULT_TIMEOUT_MS = 60000;
const DEFAULT_MAX_CHARS = Number(process.env.CATALOG_MAX_TEXT_CHARS || "18000");

const ItemSchema = z.object({
  sku: z.string().nullable(),
  model: z.string().nullable(),
  brand: z.string().nullable(),
  category: z.string().nullable(),
  productName: z.string(),
  supplierCost: z.number().nullable(),
  mlPriceAvg: z.number().nullable(),
  unitPrice: z.number().nullable(),
  boxPrice: z.number().nullable(),
  unitsPerBox: z.number().int().nullable(),
  specs: z.array(z.string()).default([]),
  notes: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});

const ResponseSchema = z.object({
  items: z.array(ItemSchema),
});

type ExtractInput = {
  extractedText: string;
  maxChars?: number;
};

type ExtractResult = {
  items: ParsedCatalogRow[];
  inputTokens?: number;
  outputTokens?: number;
  cached?: boolean;
};

type CacheHit = {
  structured_json?: unknown;
  input_tokens?: number | null;
  output_tokens?: number | null;
};

type ResponsesApiUsage = {
  input_tokens?: number;
  output_tokens?: number;
};

type ResponsesApiOutputContent = {
  text?: string;
  output_text?: string;
  type?: string;
};

type ResponsesApiOutputBlock = {
  content?: ResponsesApiOutputContent[];
};

type ResponsesApiResponse = {
  output_text?: string;
  output?: ResponsesApiOutputBlock[];
  usage?: ResponsesApiUsage;
};

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeNullableString(value: string | null | undefined): string | null {
  const normalized = normalizeSpaces(String(value ?? ""));
  return normalized || null;
}

function toPositiveNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Number(value.toFixed(2))
    : null;
}

function toPositiveInteger(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;
}

function cleanJson(raw: string): string {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function clipText(text: string, maxChars: number): string {
  if (!text) return "";
  return text.length > maxChars ? text.slice(0, maxChars) : text;
}

function buildPrompt(text: string): string {
  return [
    "Você recebe texto extraído de catálogo de fornecedor.",
    "Extraia apenas produtos reais e responda somente JSON válido.",
    "",
    "IGNORE:",
    "- especificações soltas sem produto",
    "- promoções isoladas",
    "- títulos de seção/categoria sem item",
    "- descrições repetidas",
    "- linhas quebradas que não formem produto",
    "",
    "REGRAS:",
    "- NÃO invente preço",
    "- NÃO invente SKU",
    "- priorize linhas com nome + preço",
    "- agrupe dados do mesmo produto",
    "- supplierCost = custo real do fornecedor",
    "- mlPriceAvg = preço de mercado somente se ele estiver explícito no texto; senão null",
    "- se houver unitPrice, use unitPrice",
    "- se houver boxPrice e unitsPerBox, permita cálculo posterior",
    "- productName curto, limpo e objetivo",
    "- specs com no máximo 6 entradas úteis",
    "- confidence entre 0 e 1",
    "- se não tiver segurança, retorne items vazio",
    "",
    "FORMATO:",
    JSON.stringify({
      items: [
        {
          sku: "string|null",
          model: "string|null",
          brand: "string|null",
          category: "string|null",
          productName: "string",
          supplierCost: 0,
          mlPriceAvg: 0,
          unitPrice: 0,
          boxPrice: 0,
          unitsPerBox: 0,
          specs: ["string"],
          notes: "string|null",
          confidence: 0.9,
        },
      ],
    }),
    "",
    "TEXTO:",
    text,
  ].join("\n");
}

function extractOutputText(data: ResponsesApiResponse): string {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (!Array.isArray(data.output)) {
    return "";
  }

  const parts: string[] = [];

  for (const block of data.output) {
    if (!Array.isArray(block?.content)) continue;

    for (const content of block.content) {
      if (typeof content?.text === "string" && content.text.trim()) {
        parts.push(content.text.trim());
        continue;
      }

      if (
        typeof content?.output_text === "string" &&
        content.output_text.trim()
      ) {
        parts.push(content.output_text.trim());
      }
    }
  }

  return parts.join("\n").trim();
}

function mapItem(item: z.infer<typeof ItemSchema>): ParsedCatalogRow {
  const unitPrice = toPositiveNumber(item.unitPrice);
  const boxPrice = toPositiveNumber(item.boxPrice);
  const unitsPerBox = toPositiveInteger(item.unitsPerBox);
  const directSupplierCost = toPositiveNumber(item.supplierCost);
  const mlPriceAvg = toPositiveNumber(item.mlPriceAvg);

  let supplierCost = directSupplierCost;

  if (!supplierCost && unitPrice) {
    supplierCost = unitPrice;
  }

  if (!supplierCost && boxPrice && unitsPerBox) {
    supplierCost = Number((boxPrice / unitsPerBox).toFixed(2));
  }

  return {
    sku: normalizeNullableString(item.sku),
    model: normalizeNullableString(item.model) ?? normalizeNullableString(item.sku),
    brand: normalizeNullableString(item.brand),
    category: normalizeNullableString(item.category),
    productName: normalizeSpaces(item.productName),
    supplierCost,
    mlPriceAvg,
    unitPrice,
    boxPrice,
    unitsPerBox,
    specs: item.specs
      .map(normalizeSpaces)
      .filter(Boolean)
      .slice(0, 6),
    notes: normalizeNullableString(item.notes),
    confidence: Number.isFinite(item.confidence) ? item.confidence : 0.5,
  };
}

function dedupeParsedRows(items: ParsedCatalogRow[]): ParsedCatalogRow[] {
  const map = new Map<string, ParsedCatalogRow>();

  for (const item of items) {
    const key =
      item.sku?.toLowerCase() ||
      `${item.productName.toLowerCase()}::${Number(item.supplierCost ?? 0).toFixed(2)}`;

    const existing = map.get(key);

    if (!existing) {
      map.set(key, item);
      continue;
    }

    const existingScore =
      (existing.confidence ?? 0) +
      (existing.supplierCost ? 1 : 0) +
      (existing.mlPriceAvg ? 1 : 0) +
      (existing.specs?.length ?? 0) * 0.05;

    const nextScore =
      (item.confidence ?? 0) +
      (item.supplierCost ? 1 : 0) +
      (item.mlPriceAvg ? 1 : 0) +
      (item.specs?.length ?? 0) * 0.05;

    if (nextScore >= existingScore) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

export async function extractCatalogItemsWithAI(
  input: ExtractInput
): Promise<ExtractResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const rawText = normalizeSpaces(input.extractedText || "");

  if (!rawText) {
    return { items: [] };
  }

  const maxChars =
    typeof input.maxChars === "number" && input.maxChars > 0
      ? input.maxChars
      : DEFAULT_MAX_CHARS;

  const clippedText = clipText(rawText, maxChars);

  const cacheKey = sha256String(
    JSON.stringify({
      version: CACHE_VERSION,
      model: DEFAULT_MODEL,
      text: clippedText,
    })
  );

  const cache = (await getCatalogAiCache(cacheKey, CACHE_VERSION)) as CacheHit | null;

  if (cache?.structured_json) {
    const parsed = ResponseSchema.parse(cache.structured_json);
    const items = dedupeParsedRows(parsed.items.map(mapItem));

    return {
      items,
      inputTokens: cache.input_tokens ?? undefined,
      outputTokens: cache.output_tokens ?? undefined,
      cached: true,
    };
  }

  const prompt = buildPrompt(clippedText);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: "Você extrai produtos reais de catálogos e responde apenas JSON válido.",
              },
            ],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: prompt }],
          },
        ],
        text: {
          format: {
            type: "json_object",
          },
        },
        truncation: "auto",
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");

      if (response.status === 429 && errText.includes("insufficient_quota")) {
        throw new Error("OPENAI_INSUFFICIENT_QUOTA");
      }

      console.error("[catalog/ai] erro OpenAI:", errText);
      return { items: [] };
    }

    const data = (await response.json()) as ResponsesApiResponse;
    const rawOutput = extractOutputText(data);

    if (!rawOutput) {
      console.error("[catalog/ai] resposta vazia");
      return {
        items: [],
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
      };
    }

    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(cleanJson(rawOutput));
    } catch {
      console.error("[catalog/ai] JSON inválido:", rawOutput);
      return {
        items: [],
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
      };
    }

    const parsed = ResponseSchema.parse(parsedJson);
    const items = dedupeParsedRows(parsed.items.map(mapItem));

    await saveCatalogAiCache({
      cacheKey,
      version: CACHE_VERSION,
      model: DEFAULT_MODEL,
      extractedText: clippedText,
      structuredJson: parsed,
      itemsCount: items.length,
      inputTokens: data.usage?.input_tokens ?? null,
      outputTokens: data.usage?.output_tokens ?? null,
    });

    return {
      items,
      inputTokens: data.usage?.input_tokens,
      outputTokens: data.usage?.output_tokens,
      cached: false,
    };
  } catch (error) {
    console.error("[catalog/ai] erro:", error);
    return { items: [] };
  } finally {
    clearTimeout(timeout);
  }
}
