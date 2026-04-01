import { z } from "zod";
import type { ParsedCatalogRow } from "./types";
import { getCatalogAiCache, saveCatalogAiCache } from "@/server/catalog/cache";
import { sha256String } from "@/lib/catalog/hash";

const ItemSchema = z.object({
  sku: z.string().nullable(),
  model: z.string().nullable(),
  brand: z.string().nullable(),
  category: z.string().nullable(),
  productName: z.string(),
  supplierCost: z.number().nullable(),
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

type CacheHit = {
  structured_json?: unknown;
  items_count?: number | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
};

type ResponsesApiContent = {
  text?: string;
  output_text?: string;
} | null | undefined;

type ResponsesApiBlock = {
  content?: ResponsesApiContent[];
} | null;

type ResponsesApiUsage = {
  input_tokens?: number;
  output_tokens?: number;
};

type ResponsesApiResponse = {
  output_text?: string;
  output?: ResponsesApiBlock[];
  usage?: ResponsesApiUsage;
};

type JsonPrimitiveType =
  | "string"
  | "number"
  | "integer"
  | "array"
  | "object"
  | "null";

type JsonSchemaScalar =
  | { type: JsonPrimitiveType }
  | { type: JsonPrimitiveType[] };

type JsonSchemaArray = {
  type: "array";
  items: JsonSchemaProperty;
};

type JsonSchemaObject = {
  type: "object";
  additionalProperties: false;
  properties: Record<string, JsonSchemaProperty>;
  required: string[];
};

type JsonSchemaProperty =
  | JsonSchemaScalar
  | JsonSchemaArray
  | JsonSchemaObject;

type JsonSchema = JsonSchemaObject;

type ExtractCatalogItemsWithAIInput = {
  extractedText: string;
  maxChars?: number;
};

type ExtractCatalogItemsWithAIResult = {
  items: ParsedCatalogRow[];
  inputTokens?: number;
  outputTokens?: number;
  cached?: boolean;
};

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function cleanJsonText(raw: string): string {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractTextFromResponsesApi(data: ResponsesApiResponse): string {
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

function buildPrompt(catalogText: string): string {
  return [
    "Você receberá o texto extraído de um catálogo de fornecedor.",
    "Extraia apenas produtos reais.",
    "",
    "IGNORE COMPLETAMENTE:",
    "- especificações técnicas isoladas sem produto",
    "- observações genéricas",
    "- promoções soltas",
    "- linhas repetidas de descrição",
    "- quantidade por caixa isolada sem produto",
    "- linhas como cor, voltagem, peso, dimensões, potência, canal, saída, material, temperatura, modo, função, quando vierem sem contexto do item",
    "",
    "REGRAS:",
    "- um item deve ter nome de produto e pelo menos um preço/custo OU forte evidência de item de catálogo",
    "- supplierCost deve ser o custo unitário",
    "- se houver boxPrice e unitsPerBox, calcule supplierCost = boxPrice / unitsPerBox",
    "- não invente preço",
    "- não invente SKU",
    "- productName deve ser curto, limpo e objetivo",
    "- specs deve conter no máximo 6 especificações curtas úteis",
    "- confidence deve ser um número entre 0 e 1",
    "- retorne SOMENTE JSON válido",
    "",
    "FORMATO EXATO:",
    JSON.stringify({
      items: [
        {
          sku: "string|null",
          model: "string|null",
          brand: "string|null",
          category: "string|null",
          productName: "string",
          supplierCost: 0,
          unitPrice: 0,
          boxPrice: 0,
          unitsPerBox: 0,
          specs: ["string"],
          notes: "string|null",
          confidence: 0.95,
        },
      ],
    }),
    "",
    "Se não tiver segurança, retorne items vazio.",
    "",
    "Texto do catálogo:",
    catalogText,
  ].join("\n");
}

function toPositiveNumber(value: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Number(value.toFixed(2))
    : null;
}

function toPositiveInteger(value: number | null): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;
}

function mapItemToParsedRow(item: z.infer<typeof ItemSchema>): ParsedCatalogRow {
  const normalizedSku = item.sku ? normalizeSpaces(item.sku) : null;
  const normalizedModel = item.model
    ? normalizeSpaces(item.model)
    : normalizedSku;
  const normalizedBrand = item.brand ? normalizeSpaces(item.brand) : null;
  const normalizedCategory = item.category
    ? normalizeSpaces(item.category)
    : null;

  const unitPrice = toPositiveNumber(item.unitPrice);
  const boxPrice = toPositiveNumber(item.boxPrice);
  const unitsPerBox = toPositiveInteger(item.unitsPerBox);
  const directSupplierCost = toPositiveNumber(item.supplierCost);

  let supplierCost: number | null = directSupplierCost;

  if (!supplierCost && unitPrice) {
    supplierCost = unitPrice;
  }

  if (!supplierCost && boxPrice && unitsPerBox) {
    supplierCost = Number((boxPrice / unitsPerBox).toFixed(2));
  }

  return {
    sku: normalizedSku,
    model: normalizedModel,
    brand: normalizedBrand,
    category: normalizedCategory,
    productName: normalizeSpaces(item.productName),
    supplierCost,
    unitPrice,
    boxPrice,
    unitsPerBox,
    specs: item.specs.map(normalizeSpaces).filter(Boolean).slice(0, 6),
    notes: item.notes ? normalizeSpaces(item.notes) : null,
    confidence: item.confidence,
  };
}

function buildSchema(): JsonSchema {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            sku: { type: ["string", "null"] },
            model: { type: ["string", "null"] },
            brand: { type: ["string", "null"] },
            category: { type: ["string", "null"] },
            productName: { type: "string" },
            supplierCost: { type: ["number", "null"] },
            unitPrice: { type: ["number", "null"] },
            boxPrice: { type: ["number", "null"] },
            unitsPerBox: { type: ["integer", "null"] },
            specs: {
              type: "array",
              items: { type: "string" },
            },
            notes: { type: ["string", "null"] },
            confidence: { type: "number" },
          },
          required: [
            "sku",
            "model",
            "brand",
            "category",
            "productName",
            "supplierCost",
            "unitPrice",
            "boxPrice",
            "unitsPerBox",
            "specs",
            "notes",
            "confidence",
          ],
        },
      },
    },
    required: ["items"],
  };
}

export async function extractCatalogItemsWithAI(
  input: ExtractCatalogItemsWithAIInput
): Promise<ExtractCatalogItemsWithAIResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const maxChars = Number(process.env.CATALOG_MAX_TEXT_CHARS || "40000");
  const cacheVersion = "v1";

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const rawText = (input.extractedText || "").trim();

  if (!rawText) {
    return { items: [] };
  }

  const effectiveMaxChars =
    typeof input.maxChars === "number" && input.maxChars > 0
      ? input.maxChars
      : maxChars;

  const clippedText =
    rawText.length > effectiveMaxChars
      ? rawText.slice(0, effectiveMaxChars)
      : rawText;

  const cacheKey = sha256String(
    JSON.stringify({
      version: cacheVersion,
      model,
      text: clippedText,
    })
  );

  const cacheHit = (await getCatalogAiCache(
    cacheKey,
    cacheVersion
  )) as CacheHit | null;

  if (cacheHit?.structured_json) {
    console.log("[catalog/cache] HIT", {
      cacheKey,
      items: cacheHit.items_count ?? 0,
    });

    const parsed = ResponseSchema.parse(cacheHit.structured_json);
    const items = parsed.items.map(mapItemToParsedRow);

    return {
      items,
      inputTokens: cacheHit.input_tokens ?? undefined,
      outputTokens: cacheHit.output_tokens ?? undefined,
      cached: true,
    };
  }

  console.log("[catalog/cache] MISS", { cacheKey });

  const prompt = buildPrompt(clippedText);
  const schema = buildSchema();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    console.log("[catalog/ai] chamando Responses API", {
      model,
      chars: clippedText.length,
    });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
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
            type: "json_schema",
            name: "catalog_extract",
            schema,
            strict: true,
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

      throw new Error(`OPENAI_${response.status}: ${errText}`);
    }

    const data = (await response.json()) as ResponsesApiResponse;
    const structuredText = extractTextFromResponsesApi(data);

    if (!structuredText) {
      console.error("[catalog/ai] resposta vazia da OpenAI");
      return { items: [] };
    }

    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(cleanJsonText(structuredText));
    } catch {
      console.error("[catalog/ai] erro ao parsear JSON:", structuredText);
      return { items: [] };
    }

    const parsed = ResponseSchema.parse(parsedJson);
    const items = parsed.items.map(mapItemToParsedRow);

    await saveCatalogAiCache({
      cacheKey,
      version: cacheVersion,
      model,
      extractedText: clippedText,
      structuredJson: parsed,
      itemsCount: items.length,
      inputTokens: data.usage?.input_tokens ?? null,
      outputTokens: data.usage?.output_tokens ?? null,
    });

    console.log("[catalog/cache] salvo", {
      cacheKey,
      items: items.length,
      inputTokens: data.usage?.input_tokens,
      outputTokens: data.usage?.output_tokens,
    });

    return {
      items,
      inputTokens: data.usage?.input_tokens,
      outputTokens: data.usage?.output_tokens,
      cached: false,
    };
  } finally {
    clearTimeout(timeout);
  }
}