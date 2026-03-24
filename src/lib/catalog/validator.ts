import type { ParsedCatalogRow } from "./types";

/* ================= CONFIG ================= */

const BAD_PREFIXES = [
  "temperatura",
  "tensão",
  "voltagem",
  "peso",
  "dimens",
  "consumo",
  "canal",
  "saída",
  "modo",
  "função",
  "capacidade",
  "material",
  "comprimento",
  "altura",
  "diâmetro",
  "interface",
  "lumens",
  "cor",
  "promoção",
  "ganha",
  "input",
  "output",
];

/* ================= HELPERS ================= */

function normalizeSpaces(v: string) {
  return v.replace(/\s+/g, " ").trim();
}

function normalizeText(v: string) {
  return normalizeSpaces(v).toLowerCase();
}

function isSpecLine(name: string) {
  const lower = normalizeText(name);
  return BAD_PREFIXES.some((p) => lower.startsWith(p));
}

function isGarbage(name: string) {
  const lower = normalizeText(name);

  if (lower.length < 3) return true;
  if (/^\d+[.,]?\d*$/.test(lower)) return true;

  return false;
}

function parseCost(item: ParsedCatalogRow): number | null {
  if (item.supplierCost && item.supplierCost > 0) {
    return item.supplierCost;
  }

  if (item.unitPrice && item.unitPrice > 0) {
    return item.unitPrice;
  }

  if (
    item.boxPrice &&
    item.unitsPerBox &&
    item.unitsPerBox > 0
  ) {
    return Number((item.boxPrice / item.unitsPerBox).toFixed(2));
  }

  return null;
}

function cleanName(name: string): string {
  return normalizeSpaces(
    name
      .replace(/\bSKU[:\s-]*[A-Z0-9._/-]+\b/gi, "")
      .replace(/\bC[ÓO]D(?:IGO)?[:\s-]*[A-Z0-9._/-]+\b/gi, "")
      .replace(/\bREF[:\s-]*[A-Z0-9._/-]+\b/gi, "")
      .replace(/\b\d+\s*(un|und|unid)\b/gi, "")
      .replace(/\bkit\s*\d+\b/gi, "")
      .replace(/[|•·]+/g, " ")
  );
}

function keyOf(item: ParsedCatalogRow) {
  return `${(item.sku || "").toLowerCase()}::${normalizeText(item.productName)}`;
}

function score(item: ParsedCatalogRow) {
  let s = 0;

  if (item.productName.length > 6) s += 2;
  if (item.supplierCost) s += 3;
  if (item.sku) s += 2;
  if (item.brand) s += 1;
  if (item.unitsPerBox) s += 1;
  if (item.confidence > 0.8) s += 2;

  if (isSpecLine(item.productName)) s -= 6;
  if (isGarbage(item.productName)) s -= 6;

  return s;
}

/* ================= CORE ================= */

function cleanItem(item: ParsedCatalogRow): ParsedCatalogRow {
  const productName = cleanName(item.productName);

  const supplierCost = parseCost(item);

  return {
    ...item,
    sku: item.sku ? normalizeSpaces(item.sku) : null,
    model: item.model || item.sku || null,
    brand: item.brand ? normalizeSpaces(item.brand) : null,
    category: item.category ? normalizeSpaces(item.category) : null,

    productName,

    supplierCost,

    unitPrice:
      item.unitPrice && item.unitPrice > 0
        ? Number(item.unitPrice.toFixed(2))
        : null,

    boxPrice:
      item.boxPrice && item.boxPrice > 0
        ? Number(item.boxPrice.toFixed(2))
        : null,

    unitsPerBox:
      item.unitsPerBox && item.unitsPerBox > 0
        ? Math.floor(item.unitsPerBox)
        : null,

    specs: (item.specs || []).slice(0, 6),

    notes: item.notes || null,

    confidence:
      typeof item.confidence === "number"
        ? Math.max(0, Math.min(1, item.confidence))
        : 0.5,
  };
}

/* ================= MAIN ================= */

export function validateAndNormalizeCatalogItems(
  items: ParsedCatalogRow[],
  maxRows = Number(process.env.CATALOG_MAX_ROWS_PER_JOB || "400")
): ParsedCatalogRow[] {
  const cleaned = items
    .map(cleanItem)
    .filter((item) => item.productName.length >= 4)
    .filter((item) => !isSpecLine(item.productName))
    .filter((item) => !isGarbage(item.productName))
    .filter((item) => item.supplierCost !== null)
    .filter((item) => item.supplierCost! > 0)
    .filter((item) => item.supplierCost! < 1_000_000);

  const map = new Map<string, ParsedCatalogRow>();

  for (const item of cleaned) {
    const key = keyOf(item);
    const prev = map.get(key);

    if (!prev || score(item) > score(prev)) {
      map.set(key, item);
    }
  }

  return Array.from(map.values())
    .sort(
      (a, b) =>
        b.confidence - a.confidence ||
        score(b) - score(a)
    )
    .slice(0, maxRows);
}