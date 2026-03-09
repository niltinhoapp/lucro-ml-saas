type AIExtractedCatalogItem = {
  sku: string | null;
  productName: string;
  supplierCost: number;
};

type AIExtractedCatalogResponse = {
  items: AIExtractedCatalogItem[];
};

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
        if (typeof content?.text === "string") {
          parts.push(content.text);
        } else if (typeof content?.output_text === "string") {
          parts.push(content.output_text);
        }
      }
    }

    if (parts.length) return parts.join("\n").trim();
  }

  return "";
}

function normalizeItem(item: any): AIExtractedCatalogItem | null {
  const productName =
    typeof item?.productName === "string"
      ? item.productName.trim()
      : typeof item?.name === "string"
      ? item.name.trim()
      : "";

  const sku =
    typeof item?.sku === "string" && item.sku.trim()
      ? item.sku.trim()
      : null;

  const supplierCost = Number(item?.supplierCost ?? item?.cost ?? 0);

  if (!productName) return null;
  if (!Number.isFinite(supplierCost) || supplierCost <= 0) return null;

  return {
    sku,
    productName,
    supplierCost: Number(supplierCost.toFixed(2)),
  };
}

export async function extractCatalogItemsWithAI(
  extractedText: string
): Promise<AIExtractedCatalogItem[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log("[catalog/ai] OPENAI_API_KEY ausente; IA desativada");
    return [];
  }

  const model = process.env.OPENAI_MODEL || "gpt-5-mini";

  const prompt = [
    "Você receberá o texto extraído de um catálogo de fornecedor.",
    "Sua tarefa é identificar produtos reais e devolver apenas JSON válido.",
    "",
    "Regras obrigatórias:",
    "- Retorne SOMENTE JSON, sem explicação.",
    '- Formato exato: {"items":[{"sku":string|null,"productName":string,"supplierCost":number}]}',
    "- Ignore hashtags, observações, bullets técnicos, dados promocionais, páginas e metadados.",
    "- Associe SKU, nome e preço do mesmo produto mesmo que estejam em linhas diferentes.",
    "- Se houver mais de um preço próximo, escolha o preço unitário mais provável.",
    "- Não invente itens.",
    "- Se não tiver confiança mínima, ignore o item.",
    "- supplierCost deve ser número decimal.",
    "",
    "Texto do catálogo:",
    extractedText.slice(0, 18000),
  ].join("\n");

  console.log("[catalog/ai] chamando Responses API com modelo:", model);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
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
  const data = await response.json();
  const rawText = extractTextFromResponsesApi(data);

  console.log("[catalog/ai] preview resposta:", rawText.slice(0, 1200));

  if (!rawText) return [];

  try {
    const parsed = JSON.parse(cleanJsonText(rawText)) as AIExtractedCatalogResponse;
    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    const normalized = items.map(normalizeItem).filter(Boolean) as AIExtractedCatalogItem[];

    const deduped = new Map<string, AIExtractedCatalogItem>();
    for (const item of normalized) {
      const key = `${(item.sku || "").toLowerCase()}::${item.productName.toLowerCase()}::${item.supplierCost.toFixed(2)}`;
      if (!deduped.has(key)) deduped.set(key, item);
    }

    const result = Array.from(deduped.values());
    console.log("[catalog/ai] itens estruturados:", result.length);
    console.log("[catalog/ai] preview itens:", result.slice(0, 15));

    return result;
  } catch (error) {
    console.error("[catalog/ai] falha ao parsear JSON da IA:", error);
    return [];
  }
}