type FallbackCatalogItem = {
  sku: string | null;
  model: string | null;
  brand: string | null;
  category: string | null;
  productName: string;
  supplierCost: number | null;
  unitPrice: number | null;
  boxPrice: number | null;
  unitsPerBox: number | null;
  specs: string[];
  notes: string | null;
  confidence: number;
};

function normalizeLine(line: string): string {
  return (line || "")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

function parseBrazilianPrice(value: string): number | null {
  const raw = (value || "").trim();
  if (!raw) return null;

  const match = raw.match(/-?\d{1,3}(?:\.\d{3})*(?:,\d{2})|-?\d+(?:\.\d{2})/);
  if (!match) return null;

  const token = match[0];
  const normalized = token.includes(",")
    ? token.replace(/\./g, "").replace(",", ".")
    : token;

  const num = Number(normalized);
  if (!Number.isFinite(num)) return null;

  return Number(num.toFixed(2));
}

function parseInteger(value: string): number | null {
  const raw = (value || "").replace(/[^\d]/g, "").trim();
  if (!raw) return null;

  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

function extractSku(line: string): string | null {
  const patterns = [
    /\bSKU[:#\s-]*([A-Z0-9._/-]{3,})\b/i,
    /\bC[ÓO]D(?:IGO)?[:#\s-]*([A-Z0-9._/-]{3,})\b/i,
    /\bREF(?:ER[EÊ]NCIA)?[:#\s-]*([A-Z0-9._/-]{3,})\b/i,
    /\b([A-Z]{2,8}-?\d{2,12}[A-Z0-9._/-]*)\b/,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return null;
}

function extractUnitsPerBox(line: string): number | null {
  const patterns = [
    /\b(\d{1,4})\s*(?:un|und|unid|unidades)\s*(?:\/|\bpor\b)?\s*(?:cx|caixa)\b/i,
    /\b(?:cx|caixa)\s*(?:c\/|com)?\s*(\d{1,4})\s*(?:un|und|unid|unidades)\b/i,
    /\bkit\s*(?:com)?\s*(\d{1,4})\b/i,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match?.[1]) return parseInteger(match[1]);
  }

  return null;
}

function extractBrand(line: string): string | null {
  const patterns = [
    /\bmarca[:\s-]+([A-Za-zÀ-ÿ0-9 .&/_-]{2,40})/i,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return null;
}

function cleanProductName(line: string, priceToken?: string | null): string {
  let value = line;

  if (priceToken) {
    value = value.replace(priceToken, " ");
  }

  value = value
    .replace(/\bSKU[:#\s-]*[A-Z0-9._/-]+\b/gi, " ")
    .replace(/\bC[ÓO]D(?:IGO)?[:#\s-]*[A-Z0-9._/-]+\b/gi, " ")
    .replace(/\bREF(?:ER[EÊ]NCIA)?[:#\s-]*[A-Z0-9._/-]+\b/gi, " ")
    .replace(/\bmarca[:\s-]+[A-Za-zÀ-ÿ0-9 .&/_-]{2,40}\b/gi, " ")
    .replace(/\b\d{1,4}\s*(?:un|und|unid|unidades)\s*(?:\/|\bpor\b)?\s*(?:cx|caixa)\b/gi, " ")
    .replace(/\b(?:cx|caixa)\s*(?:c\/|com)?\s*\d{1,4}\s*(?:un|und|unid|unidades)\b/gi, " ")
    .replace(/\bkit\s*(?:com)?\s*\d{1,4}\b/gi, " ")
    .replace(/[|•·]+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();

  return value;
}

function lineLooksPromising(line: string): boolean {
  if (!line) return false;
  if (line.length < 8) return false;

  const hasLetters = /[a-zA-ZÀ-ÿ]/.test(line);
  const hasPrice = /\d{1,3}(?:\.\d{3})*,\d{2}|\d+\.\d{2}/.test(line);

  return hasLetters && hasPrice;
}

export function extractCatalogItemsFallback(
  text: string
): FallbackCatalogItem[] {
  const lines = (text || "")
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean);

  const items: FallbackCatalogItem[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    if (!lineLooksPromising(line)) continue;

    const priceMatch = line.match(/\d{1,3}(?:\.\d{3})*,\d{2}|\d+\.\d{2}/);
    const priceToken = priceMatch?.[0] ?? null;
    const supplierCost = priceToken ? parseBrazilianPrice(priceToken) : null;

    if (!supplierCost || supplierCost <= 0) continue;

    const sku = extractSku(line);
    const unitsPerBox = extractUnitsPerBox(line);
    const brand = extractBrand(line);
    const productName = cleanProductName(line, priceToken);

    if (!productName || productName.length < 4) continue;

    const dedupeKey = `${sku ?? ""}::${productName.toLowerCase()}::${supplierCost}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const confidence =
      0.35 +
      (sku ? 0.15 : 0) +
      (brand ? 0.1 : 0) +
      (unitsPerBox ? 0.1 : 0) +
      (productName.length > 12 ? 0.1 : 0);

    items.push({
      sku,
      model: null,
      brand,
      category: null,
      productName,
      supplierCost,
      unitPrice: unitsPerBox && unitsPerBox > 1 ? null : supplierCost,
      boxPrice: unitsPerBox && unitsPerBox > 1 ? supplierCost : null,
      unitsPerBox,
      specs: [],
      notes: "Extraído por fallback local sem IA.",
      confidence: Number(Math.min(confidence, 0.8).toFixed(2)),
    });
  }

  return items;
}