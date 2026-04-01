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

function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function cleanJsonText(raw: string) {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractTextFromResponsesApi(data: any): string {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (Array.isArray(data?.output)) {
    const parts: string[] = [];

    for (const block of data.output) {
      if (!Array.isArray(block?.content)) continue;

      for (const content of block.content) {
        if (typeof content?.text === "string" && content.text.trim()) {
          parts.push(content.text.trim());
        } else if (
          typeof content?.output_text === "string" &&
          content.output_text.trim()
        ) {
          parts.push(content.output_text.trim());
        }
      }
    }

    if (parts.length) return parts.join("\n").trim();
  }

  return "";
}

function buildPrompt(catalogText: string) {
  return [
    "Você receberá o texto extraído de um catálogo de fornecedor.",
    "Extraia apenas produtos reais.",
    "",
    "IGNORE COMPLETAMENTE:",
    "- especificações técnicas",
    "- observações",
    "- promoções",
    "- linhas de descrição",
    "- quantidade por caixa isolada",
    "- linhas como cor, voltagem, peso, dimensões, potência, canal, saída, material, temperatura, modo, função",
    "",
    "REGRAS:",
    "- um item deve ter nome de produto e pelo menos um preço/custo ou forte evidência de item de catálogo",
    "- supplierCost deve ser o custo unitário",
    "- se houver boxPrice e unitsPerBox, calcule supplierCost = boxPrice / unitsPerBox",
    "- não invente preço",
    "- não invente SKU",
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
export async function extractCatalogItemsWithAI(input: {
  extractedText: string;
  maxChars?: number;
}): Promise<{
  items: ParsedCatalogRow[];
  inputTokens?: number;
  outputTokens?: number;
  cached?: boolean;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const maxChars = Number(process.env.CATALOG_MAX_TEXT_CHARS || "40000");
  const CACHE_VERSION = "v1";

  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const rawText = (input.extractedText || "").trim();
  if (!rawText) return { items: [] };

  const clippedText = rawText.slice(0, input.maxChars || maxChars);

  const cacheKey = sha256String(
    JSON.stringify({
      version: CACHE_VERSION,
      model,
      text: clippedText,
    })
  );

  const cacheHit = await getCatalogAiCache(cacheKey, CACHE_VERSION);

  if (cacheHit?.structured_json) {
    console.log("[catalog/cache] HIT", {
      cacheKey,
      items: cacheHit.items_count,
    });

    const parsed = ResponseSchema.parse(cacheHit.structured_json);

    const items: ParsedCatalogRow[] = parsed.items.map((item) => ({
      sku: item.sku ? normalizeSpaces(item.sku) : null,
      model: item.model
        ? normalizeSpaces(item.model)
        : item.sku
        ? normalizeSpaces(item.sku)
        : null,
      brand: item.brand ? normalizeSpaces(item.brand) : null,
      category: item.category ? normalizeSpaces(item.category) : null,
      productName: normalizeSpaces(item.productName),
      supplierCost:
        typeof item.supplierCost === "number" && item.supplierCost > 0
          ? Number(item.supplierCost.toFixed(2))
          : typeof item.unitPrice === "number" && item.unitPrice > 0
          ? Number(item.unitPrice.toFixed(2))
          : typeof item.boxPrice === "number" &&
            item.boxPrice > 0 &&
            typeof item.unitsPerBox === "number" &&
            item.unitsPerBox > 0
          ? Number((item.boxPrice / item.unitsPerBox).toFixed(2))
          : null,
      unitPrice:
        typeof item.unitPrice === "number" && item.unitPrice > 0
          ? Number(item.unitPrice.toFixed(2))
          : null,
      boxPrice:
        typeof item.boxPrice === "number" && item.boxPrice > 0
          ? Number(item.boxPrice.toFixed(2))
          : null,
      unitsPerBox:
        typeof item.unitsPerBox === "number" && item.unitsPerBox > 0
          ? item.unitsPerBox
          : null,
      specs: item.specs.map(normalizeSpaces).filter(Boolean).slice(0, 6),
      notes: item.notes ? normalizeSpaces(item.notes) : null,
      confidence: item.confidence,
    }));

    return {
      items,
      inputTokens: cacheHit.input_tokens ?? undefined,
      outputTokens: cacheHit.output_tokens ?? undefined,
      cached: true,
    };
  }

  console.log("[catalog/cache] MISS", { cacheKey });

  const prompt = buildPrompt(clippedText);

  const schema = {
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
            specs: { type: "array", items: { type: "string" } },
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

    const data = await response.json();
    const structuredText = extractTextFromResponsesApi(data);
    const parsed = ResponseSchema.parse(JSON.parse(cleanJsonText(structuredText)));

    const items: ParsedCatalogRow[] = parsed.items.map((item) => ({
      sku: item.sku ? normalizeSpaces(item.sku) : null,
      model: item.model
        ? normalizeSpaces(item.model)
        : item.sku
        ? normalizeSpaces(item.sku)
        : null,
      brand: item.brand ? normalizeSpaces(item.brand) : null,
      category: item.category ? normalizeSpaces(item.category) : null,
      productName: normalizeSpaces(item.productName),
      supplierCost:
        typeof item.supplierCost === "number" && item.supplierCost > 0
          ? Number(item.supplierCost.toFixed(2))
          : typeof item.unitPrice === "number" && item.unitPrice > 0
          ? Number(item.unitPrice.toFixed(2))
          : typeof item.boxPrice === "number" &&
            item.boxPrice > 0 &&
            typeof item.unitsPerBox === "number" &&
            item.unitsPerBox > 0
          ? Number((item.boxPrice / item.unitsPerBox).toFixed(2))
          : null,
      unitPrice:
        typeof item.unitPrice === "number" && item.unitPrice > 0
          ? Number(item.unitPrice.toFixed(2))
          : null,
      boxPrice:
        typeof item.boxPrice === "number" && item.boxPrice > 0
          ? Number(item.boxPrice.toFixed(2))
          : null,
      unitsPerBox:
        typeof item.unitsPerBox === "number" && item.unitsPerBox > 0
          ? item.unitsPerBox
          : null,
      specs: item.specs.map(normalizeSpaces).filter(Boolean).slice(0, 6),
      notes: item.notes ? normalizeSpaces(item.notes) : null,
      confidence: item.confidence,
    }));

    await saveCatalogAiCache({
      cacheKey,
      version: CACHE_VERSION,
      model,
      extractedText: clippedText,
      structuredJson: parsed,
      itemsCount: items.length,
      inputTokens: data?.usage?.input_tokens ?? null,
      outputTokens: data?.usage?.output_tokens ?? null,
    });

    console.log("[catalog/cache] salvo", {
      cacheKey,
      items: items.length,
      inputTokens: data?.usage?.input_tokens,
      outputTokens: data?.usage?.output_tokens,
    });

    return {
      items,
      inputTokens: data?.usage?.input_tokens,
      outputTokens: data?.usage?.output_tokens,
      cached: false,
    };
  } finally {
    clearTimeout(timeout);
  }
}

