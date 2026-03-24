import { z } from "zod";
import type { ParsedCatalogRow } from "./types";
import { getCatalogAiCache, saveCatalogAiCache } from "@/server/catalog/cache";
import { sha256String } from "@/lib/catalog/hash";

/* ================= SCHEMA ================= */

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

/* ================= HELPERS ================= */

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

function sanitizeInputText(text: string) {
  return text
    .replace(/%PDF[\s\S]+?endobj/gi, " ")
    .replace(/xref[\s\S]+?trailer/gi, " ")
    .replace(/[^\x09\x0A\x0D\x20-\x7EÀ-ÿ]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractTextFromResponsesApi(data: any): string {
  if (typeof data?.output_text === "string") return data.output_text;

  if (Array.isArray(data?.output)) {
    return data.output
      .flatMap((o: any) => o?.content || [])
      .map((c: any) => c?.text || c?.output_text || "")
      .join("\n");
  }

  return "";
}

function buildPrompt(text: string) {
  return `
Você está analisando um catálogo de fornecedor.

Sua tarefa:
Extrair apenas produtos reais e vendáveis.

REGRAS IMPORTANTES:
- Ignore totalmente especificações técnicas isoladas
- Ignore textos longos de descrição
- Ignore linhas sem preço ou sem evidência de produto
- NÃO invente valores
- NÃO invente SKU

LÓGICA:
- Se houver caixa + quantidade → calcule custo unitário
- Preferir custo unitário
- confidence entre 0 e 1

FORMATO JSON EXATO:
{
  "items": [
    {
      "sku": "string|null",
      "model": "string|null",
      "brand": "string|null",
      "category": "string|null",
      "productName": "string",
      "supplierCost": 0,
      "unitPrice": 0,
      "boxPrice": 0,
      "unitsPerBox": 0,
      "specs": ["string"],
      "notes": "string|null",
      "confidence": 0.9
    }
  ]
}

Se não tiver certeza → retorne items vazio.

TEXTO:
${text}
`;
}

function mapItems(parsed: any[]): ParsedCatalogRow[] {
  return parsed.map((item) => ({
    sku: item.sku ? normalizeSpaces(item.sku) : null,
    model: item.model || item.sku || null,
    brand: item.brand || null,
    category: item.category || null,
    productName: normalizeSpaces(item.productName),

    supplierCost:
      item.supplierCost ??
      item.unitPrice ??
      (item.boxPrice && item.unitsPerBox
        ? item.boxPrice / item.unitsPerBox
        : null),

    unitPrice: item.unitPrice ?? null,
    boxPrice: item.boxPrice ?? null,
    unitsPerBox: item.unitsPerBox ?? null,

    specs: (item.specs || []).slice(0, 6),
    notes: item.notes ?? null,
    confidence: item.confidence ?? 0.5,
  }));
}

/* ================= MAIN ================= */

export async function extractCatalogItemsWithAI(input: {
  extractedText: string;
}): Promise<{
  items: ParsedCatalogRow[];
  inputTokens?: number;
  outputTokens?: number;
  cached?: boolean;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const raw = input.extractedText || "";
  const clean = sanitizeInputText(raw).slice(0, 40000);

  if (!clean) return { items: [] };

  const cacheKey = sha256String(clean);

  const cache = await getCatalogAiCache(cacheKey, "v2");

  if (cache?.structured_json) {
    const parsed = ResponseSchema.parse(cache.structured_json);
    return {
      items: mapItems(parsed.items),
      cached: true,
    };
  }

  const prompt = buildPrompt(clean);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "catalog",
            schema: {
              type: "object",
              properties: {
                items: { type: "array" },
              },
              required: ["items"],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const txt = await response.text();
      throw new Error(txt);
    }

    const data = await response.json();

    const rawText = extractTextFromResponsesApi(data);
    const parsed = ResponseSchema.parse(
      JSON.parse(cleanJsonText(rawText))
    );

    const items = mapItems(parsed.items);

    await saveCatalogAiCache({
      cacheKey,
      version: "v2",
      model,
      extractedText: clean,
      structuredJson: parsed,
      itemsCount: items.length,
    });

    return {
      items,
      inputTokens: data?.usage?.input_tokens,
      outputTokens: data?.usage?.output_tokens,
    };
  } catch (error) {
    console.error("[AI ERROR]", error);

    // 🔥 fallback interno simples
    return {
      items: [],
    };
  } finally {
    clearTimeout(timeout);
  }
}