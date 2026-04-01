import type { ParsedCatalogRow } from "./types";

export type AIExtractedCatalogItem = {
  sku?: string | null;
  model?: string | null;
  productName?: string;
  unitPrice?: number | null;
  boxPrice?: number | null;
  unitsPerBox?: number | null;
  supplierCost?: number | null;
  notes?: string | null;
  brand?: string | null;
  category?: string | null;
  specs?: string[] | null;
  confidence?: number | null;
};

export type AIExtractedCatalogResponse = {
  items: AIExtractedCatalogItem[];
};

export type CatalogExtractionResult = {
  items: ParsedCatalogRow[];
  source: "openai" | "local_fallback" | "local_no_api";
};

type ResponsesApiContent = {
  text?: string;
  output_text?: string;
};

type ResponsesApiBlock = {
  content?: ResponsesApiContent[];
};

type ResponsesApiResponse = {
  output_text?: string;
  output?: ResponsesApiBlock[];
};

const OPENAI_TIMEOUT_MS = 30000;
const MAX_OPENAI_INPUT_CHARS = 18000;

const BLOCKED_TERMS = [
  "catálogo",
  "catalogo",
  "página",
  "pagina",
  "observações",
  "observacao",
  "promoção",
  "promocao",
  "válido",
  "valido",
  "oferta",
  "atacado",
  "varejo",
  "consulte",
  "tabela",
  "pedido mínimo",
  "pedido minimo",
  "preços sujeitos",
  "precos sujeitos",
  "imagem ilustrativa",
  "frete",
  "whatsapp",
  "instagram",
  "site",
  "cnpj",
  "pix",
  "unid.cx",
  "pcs/cx",
  "peso do produto",
  "valor de proteção",
  "proteção contra sobrecorrente",
  "índice",
  "indice",
  "política de compra",
  "politica de compra",
  "suporte técnico",
  "suporte tecnico",
  "importante",
  "garantia",
  "google my business",
  "telefone",
  "esgotado",
  "comprando",
  "acima de",
  "off",
  "desconto",
  "opções de cores",
  "opcoes de cores",
  "saiba mais",
];

const TECHNICAL_TERMS = [
  "tamanho:",
  "peso:",
  "material:",
  "entrada:",
  "potência:",
  "potencia:",
  "bateria:",
  "modo de operação:",
  "modo de operacao:",
  "temperatura da cor:",
  "conexão:",
  "conexao:",
  "alimentação:",
  "alimentacao:",
  "carregamento:",
  "acompanha:",
  "funções:",
  "funcoes:",
  "prisma:",
  "tweeter:",
  "brilho",
  "canais dmx:",
  "características:",
  "caracteristicas:",
  "aviso:",
  "saiba mais",
  "unid. cx",
  "pcs/cx",
];

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

  if (!Array.isArray(data.output)) return "";

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

function parseBrazilianPrice(value: string): number | null {
  if (!value) return null;

  const cleaned = value
    .toLowerCase()
    .replace(/r\$/g, "")
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");

  const num = Number(cleaned);

  if (!Number.isFinite(num) || num <= 0) return null;
  return Number(num.toFixed(2));
}

function parsePositiveInteger(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;

  const value = Number(digits);
  if (!Number.isInteger(value) || value <= 0) return null;

  return value;
}

function sanitizeProductName(raw: string): string {
  let value = normalizeSpaces(raw);

  value = value.replace(/--\s*\d+\s*of\s*\d+\s*--/gi, " ");
  value = value.replace(/\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/gi, " ");
  value = value.replace(/\br\$\s*\d{1,6}(?:[.,]\d{2})\b/gi, " ");
  value = value.replace(/\b\d+\s*pcs\/cx:?\b/gi, " ");
  value = value.replace(/\bunid\.?cx:?\b/gi, " ");
  value = value.replace(/\bun\.?:?\b/gi, " ");
  value = value.replace(/\bqtde\.?:?\b/gi, " ");
  value = value.replace(/\bcaixa\b/gi, " ");
  value = value.replace(/\besgotado\b/gi, " ");
  value = value.replace(/\bsaiba mais\b/gi, " ");
  value = value.replace(/\bacima de \d+ caixas?\b/gi, " ");
  value = value.replace(/\bcomprando \d+ caixas?\b/gi, " ");
  value = value.replace(/\bcomprando \d+\b/gi, " ");
  value = value.replace(/\b\d+% ?off\b/gi, " ");
  value = value.replace(/•/g, " ");
  value = value.replace(/\b[a-z]\/[a-z](?:\/[a-z])+\b/gi, " ");
  value = value.replace(/\b\d+\s*±\s*\d+[a-z]*\b/gi, " ");
  value = value.replace(/\b\d+(?:[.,]\d+)?\s*kg\b/gi, " ");
  value = value.replace(/\bvalor de proteção contra sobrecorrente\b/gi, " ");
  value = value.replace(/\bpeso do produto\b/gi, " ");
  value = value.replace(/\bpolítica de compra\b/gi, " ");
  value = value.replace(/\bíndice\b/gi, " ");
  value = value.replace(/\s+/g, " ").trim();

  return value;
}

function isBadProductName(name: string): boolean {
  const value = name.toLowerCase();

  if (BLOCKED_TERMS.some((term) => value.includes(term))) return true;
  if (/--\s*\d+\s*of\s*\d+\s*--/i.test(value)) return true;
  if (/^\d+[.,]\d{2}$/.test(value)) return true;
  if (/^[a-z]\/[a-z](?:\/[a-z])+$/i.test(value)) return true;
  if (/^\d+\s*pcs\/cx:?$/i.test(value)) return true;
  if (/^\d+\s*kg$/i.test(value)) return true;
  if (/^\d+\s*±\s*\d+[a-z]*$/i.test(value)) return true;
  if (/^r\$\s*\d+/i.test(value)) return true;
  if (/^\d+%?\s*off$/i.test(value)) return true;
  if (/^comprando\s+\d+/i.test(value)) return true;
  if (/^acima de\s+\d+/i.test(value)) return true;
  if (/^\d+\s*opções? de cores$/i.test(value)) return true;

  return false;
}

function looksLikeTechnicalLine(text: string): boolean {
  const value = text.toLowerCase();
  return TECHNICAL_TERMS.some((term) => value.includes(term));
}

function looksLikeCatalogProductName(text: string): boolean {
  const value = sanitizeProductName(text);

  if (!value || value.length < 3) return false;
  if (isBadProductName(value)) return false;
  if (looksLikeTechnicalLine(value)) return false;
  if (/^[A-Z0-9._/-]{3,}$/i.test(value)) return false;
  if (/^\d+[.,]\d{2}$/.test(value)) return false;

  return /[a-záàâãéèêíïóôõöúçñ]/i.test(value);
}

function isHeavyVehicleLikeContext(text: string): boolean {
  const value = text.toLowerCase();
  return (
    value.includes("patinete") ||
    value.includes("scooter") ||
    value.includes("bicicleta") ||
    value.includes("hoverboard") ||
    value.includes("overboard")
  );
}

function extractSku(text: string): string | null {
  const patterns = [
    /\b(?:sku|ref|modelo|model)\s*[:#-]?\s*([A-Z0-9][A-Z0-9._/-]{2,})\b/i,
    /\b([A-Z]{2,8}-?\d{2,10}[A-Z0-9._/-]*)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = normalizeSpaces(match[1]);
      if (value.length >= 3) return value;
    }
  }

  return null;
}

function extractUnitsPerBox(text: string): number | null {
  const patterns = [
    /\b(\d+)\s*pcs\/cx\b/i,
    /\b(\d+)\s*un(?:id)?\/cx\b/i,
    /\bcaixa\s*(?:com)?\s*(\d+)\b/i,
    /\bcx\s*(?:com)?\s*(\d+)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const parsed = parsePositiveInteger(match[1]);
      if (parsed) return parsed;
    }
  }

  return null;
}

function extractAllPrices(text: string): number[] {
  const matches = text.match(/\d{1,6}(?:[.,]\d{2})/g) || [];
  const prices = matches
    .map((v) => parseBrazilianPrice(v))
    .filter((v): v is number => v !== null);

  return Array.from(new Set(prices));
}

function chooseBestPrices(
  prices: number[],
  unitsPerBox: number | null,
  context = ""
): { unitPrice: number | null; boxPrice: number | null } {
  if (!prices.length) {
    return { unitPrice: null, boxPrice: null };
  }

  let filtered = [...prices];

  if (isHeavyVehicleLikeContext(context)) {
    filtered = filtered.filter((price) => price >= 100);
  }

  if (!filtered.length) {
    filtered = [...prices];
  }

  const sorted = [...filtered].sort((a, b) => a - b);

  if (unitsPerBox && unitsPerBox > 1) {
    if (sorted.length >= 2) {
      const low = sorted[0];
      const high = sorted[sorted.length - 1];

      if (high > low) {
        return {
          unitPrice: low,
          boxPrice: high,
        };
      }
    }

    return {
      unitPrice: sorted[0],
      boxPrice: Number((sorted[0] * unitsPerBox).toFixed(2)),
    };
  }

  return {
    unitPrice: sorted[0],
    boxPrice: null,
  };
}

function inferCategoryName(context: string, sku: string | null): string {
  const source = context.toLowerCase();

  if (source.includes("patinete")) return sku ? `PATINETE ${sku}` : "PATINETE";
  if (source.includes("bicicleta")) return sku ? `BICICLETA ${sku}` : "BICICLETA";
  if (source.includes("ventilador")) return sku ? `VENTILADOR ${sku}` : "VENTILADOR";
  if (source.includes("lanterna")) return sku ? `LANTERNA ${sku}` : "LANTERNA";
  if (source.includes("caixa de som")) return sku ? `CAIXA DE SOM ${sku}` : "CAIXA DE SOM";
  if (source.includes("fone")) return sku ? `FONE ${sku}` : "FONE";
  if (source.includes("ring light")) return sku ? `RING LIGHT ${sku}` : "RING LIGHT";
  if (source.includes("luminária") || source.includes("luminaria")) {
    return sku ? `LUMINÁRIA ${sku}` : "LUMINÁRIA";
  }
  if (source.includes("relógio") || source.includes("relogio")) {
    return sku ? `RELÓGIO ${sku}` : "RELÓGIO";
  }

  return sku ? `PRODUTO ${sku}` : "";
}

function buildProductName(
  candidates: string[],
  sku: string | null,
  context: string
): string {
  const cleanedCandidates = candidates
    .map((c) => sanitizeProductName(c))
    .filter(Boolean)
    .filter((c) => !isBadProductName(c))
    .filter((c) => !looksLikeTechnicalLine(c))
    .filter((c) => !/^[A-Z0-9._/-]{3,}$/i.test(c));

  const strong = cleanedCandidates.find((c) => {
    const lower = c.toLowerCase();
    return (
      c.length >= 5 &&
      ![
        "iluminação",
        "iluminacao",
        "acessórios",
        "acessorios",
        "casa",
        "jogos",
        "camping",
      ].includes(lower)
    );
  });

  if (strong) return strong;

  const first = cleanedCandidates.find((c) => c.length >= 3);
  if (first) return first;

  return inferCategoryName(context, sku);
}

function scoreParsedRow(item: ParsedCatalogRow): number {
  let score = 0;

  if (item.productName && !isBadProductName(item.productName)) score += 3;
  if (item.sku) score += 2;
  if (item.supplierCost !== null) score += 3;
  if (item.unitPrice) score += 2;
  if (item.boxPrice) score += 1;
  if (item.unitsPerBox) score += 1;
  if (item.confidence >= 0.8) score += 1;
  if (item.confidence < 0.4) score -= 1;

  return score;
}

function dedupeParsedItems(items: ParsedCatalogRow[]): ParsedCatalogRow[] {
  const deduped = new Map<string, ParsedCatalogRow>();

  for (const item of items) {
    const key = `${(item.sku || "").toLowerCase()}::${item.productName
      .trim()
      .toLowerCase()}`;

    const existing = deduped.get(key);

    if (!existing) {
      deduped.set(key, item);
      continue;
    }

    if (scoreParsedRow(item) > scoreParsedRow(existing)) {
      deduped.set(key, item);
    }
  }

  return Array.from(deduped.values());
}

function normalizeOpenAIItem(item: AIExtractedCatalogItem): ParsedCatalogRow | null {
  const sku =
    typeof item.sku === "string" && item.sku.trim()
      ? normalizeSpaces(item.sku)
      : null;

  const model =
    typeof item.model === "string" && item.model.trim()
      ? normalizeSpaces(item.model)
      : sku;

  const rawName = typeof item.productName === "string" ? item.productName : "";
  const productName =
    sanitizeProductName(rawName) || inferCategoryName(rawName, sku);

  const unitPrice =
    Number.isFinite(Number(item.unitPrice)) && Number(item.unitPrice) > 0
      ? Number(Number(item.unitPrice).toFixed(2))
      : null;

  const boxPrice =
    Number.isFinite(Number(item.boxPrice)) && Number(item.boxPrice) > 0
      ? Number(Number(item.boxPrice).toFixed(2))
      : null;

  const unitsPerBox =
    Number.isInteger(Number(item.unitsPerBox)) && Number(item.unitsPerBox) > 0
      ? Number(item.unitsPerBox)
      : null;

  const supplierCostRaw =
    Number.isFinite(Number(item.supplierCost)) && Number(item.supplierCost) > 0
      ? Number(item.supplierCost)
      : unitPrice !== null
      ? unitPrice
      : boxPrice !== null && unitsPerBox
        ? boxPrice / unitsPerBox
        : null;

  const supplierCost =
    supplierCostRaw !== null ? Number(supplierCostRaw.toFixed(2)) : null;

  const brand =
    typeof item.brand === "string" && item.brand.trim()
      ? normalizeSpaces(item.brand)
      : null;

  const category =
    typeof item.category === "string" && item.category.trim()
      ? normalizeSpaces(item.category)
      : null;

  const specs = Array.isArray(item.specs)
    ? item.specs
        .map((x) => String(x))
        .map(normalizeSpaces)
        .filter(Boolean)
        .slice(0, 6)
    : [];

  const confidence =
    typeof item.confidence === "number" && Number.isFinite(item.confidence)
      ? Math.max(0, Math.min(1, item.confidence))
      : sku && supplierCost !== null
        ? 0.9
        : supplierCost !== null
          ? 0.75
          : 0.5;

  if (!productName || productName.length < 3) return null;
  if (supplierCost === null && unitPrice === null && boxPrice === null) {
    return null;
  }

  return {
    productName,
    supplierCost,
    sku,
    model,
    brand,
    category,
    unitPrice,
    boxPrice,
    unitsPerBox,
    specs,
    notes:
      typeof item.notes === "string" && item.notes.trim()
        ? normalizeSpaces(item.notes)
        : null,
    confidence,
  };
}

function splitIntoCatalogBlocks(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const rawLine of lines) {
    const line = normalizeSpaces(rawLine);
    if (!line) continue;

    current.push(line);

    const hasSku = !!extractSku(line);
    const hasPrice = /\d{1,6}(?:[.,]\d{2})/.test(line);

    if ((hasSku && hasPrice) || current.length >= 10) {
      blocks.push(current);
      current = [];
    }
  }

  if (current.length) {
    blocks.push(current);
  }

  return blocks;
}

function extractCatalogItemsLocally(extractedText: string): ParsedCatalogRow[] {
  const lines = extractedText
    .split(/\r?\n/)
    .map((line) => normalizeSpaces(line))
    .filter(Boolean);

  const blocks = splitIntoCatalogBlocks(lines);
  const items: ParsedCatalogRow[] = [];

  for (const block of blocks) {
    const context = block.join(" ");
    const sku = extractSku(context);
    const unitsPerBox = extractUnitsPerBox(context);
    const prices = extractAllPrices(context);
    const { unitPrice, boxPrice } = chooseBestPrices(
      prices,
      unitsPerBox,
      context
    );

    if (!sku && !unitPrice && !boxPrice) continue;

    const productCandidates = block.filter((line) =>
      looksLikeCatalogProductName(line)
    );

    const productName = buildProductName(productCandidates, sku, context);

    const supplierCost =
      unitPrice !== null
        ? unitPrice
        : boxPrice !== null && unitsPerBox
          ? Number((boxPrice / unitsPerBox).toFixed(2))
          : boxPrice !== null
            ? boxPrice
            : null;

    if (!productName || productName.length < 3) continue;
    if (supplierCost === null) continue;

    const confidence =
      sku && unitPrice !== null
        ? 0.9
        : sku && boxPrice !== null
          ? 0.82
          : unitPrice !== null
            ? 0.72
            : 0.55;

    items.push({
      productName,
      supplierCost,
      sku,
      model: sku,
      brand: null,
      category: null,
      unitPrice,
      boxPrice,
      unitsPerBox,
      specs: [],
      notes: null,
      confidence,
    });
  }

  const result = dedupeParsedItems(items);

  console.log("[catalog/ai] fallback local itens:", result.length);
  console.log("[catalog/ai] fallback local preview:", result.slice(0, 20));

  return result;
}

async function extractCatalogItemsWithOpenAI(
  extractedText: string,
  apiKey: string
): Promise<ParsedCatalogRow[]> {
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const prompt = [
    "Você receberá o texto extraído de um catálogo de fornecedor.",
    "Sua tarefa é identificar produtos reais e devolver apenas JSON válido.",
    "",
    "Formato obrigatório:",
    '{"items":[{"sku":string|null,"model":string|null,"productName":string,"unitPrice":number|null,"boxPrice":number|null,"unitsPerBox":number|null,"supplierCost":number|null,"notes":string|null,"brand":string|null,"category":string|null,"specs":string[],"confidence":number}]}',
    "",
    "Regras obrigatórias:",
    "- Retorne SOMENTE JSON, sem explicação.",
    "- Não invente itens.",
    "- supplierCost deve representar o custo unitário real.",
    "- Se houver só preço da caixa e quantidade por caixa, calcule supplierCost = boxPrice / unitsPerBox.",
    '- Se não conseguir extrair com segurança, retorne exatamente: {"items":[]}.',
    "",
    "Texto do catálogo:",
    extractedText.slice(0, MAX_OPENAI_INPUT_CHARS),
  ].join("\n");

  console.log("[catalog/ai] chamando Responses API com modelo:", model);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

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
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: "Você extrai itens de catálogos de fornecedores e responde apenas JSON válido.",
              },
            ],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: prompt }],
          },
        ],
        max_output_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("[catalog/ai] erro API:", response.status, errText);
      throw new Error(`OPENAI_API_${response.status}`);
    }

    const data = (await response.json()) as ResponsesApiResponse;
    const rawText = extractTextFromResponsesApi(data);

    console.log("[catalog/ai] preview resposta:", rawText.slice(0, 1200));

    if (!rawText) return [];

    const parsed = JSON.parse(
      cleanJsonText(rawText)
    ) as AIExtractedCatalogResponse;

    const items = Array.isArray(parsed.items) ? parsed.items : [];
    const normalized = items
      .map(normalizeOpenAIItem)
      .filter((item): item is ParsedCatalogRow => Boolean(item));

    const result = dedupeParsedItems(normalized);

    console.log("[catalog/ai] itens estruturados:", result.length);
    console.log("[catalog/ai] preview itens:", result.slice(0, 20));

    return result;
  } finally {
    clearTimeout(timeout);
  }
}

export async function extractCatalogItems(
  extractedText: string
): Promise<CatalogExtractionResult> {
  const safeText = typeof extractedText === "string" ? extractedText.trim() : "";

  if (!safeText) {
    console.log("[catalog/ai] texto vazio");
    return {
      items: [],
      source: process.env.OPENAI_API_KEY ? "local_fallback" : "local_no_api",
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.log("[catalog/ai] OPENAI_API_KEY ausente; usando fallback local");
    return {
      items: extractCatalogItemsLocally(safeText),
      source: "local_no_api",
    };
  }

  try {
    const aiItems = await extractCatalogItemsWithOpenAI(safeText, apiKey);

    if (aiItems.length > 0) {
      return {
        items: aiItems,
        source: "openai",
      };
    }

    console.log("[catalog/ai] IA retornou vazio; usando fallback local");
    return {
      items: extractCatalogItemsLocally(safeText),
      source: "local_fallback",
    };
  } catch (error) {
    console.error("[catalog/ai] falha geral na IA; usando fallback local:", error);
    return {
      items: extractCatalogItemsLocally(safeText),
      source: "local_fallback",
    };
  }
}