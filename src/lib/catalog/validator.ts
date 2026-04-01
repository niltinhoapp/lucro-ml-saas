import type { ParsedCatalogRow } from "./types";

const BAD_NAME_PREFIXES = [
  "temperatura",
  "tensão",
  "voltagem",
  "peso",
  "peso bruto",
  "peso líquido",
  "peso liquido",
  "dimensões",
  "dimensoes",
  "dimensão",
  "dimensao",
  "consumo",
  "canal",
  "saída",
  "saida",
  "modo",
  "função",
  "funcao",
  "capacidade",
  "material",
  "comprimento",
  "altura",
  "diâmetro",
  "diametro",
  "interface",
  "interfaces",
  "lumens",
  "lúmens",
  "cor:",
  "cores:",
  "color:",
  "saiba mais",
  "promoção",
  "promocao",
  "acima de",
  "comprando",
  "ganha",
  "pcs/cx",
  "unid. cx",
  "voltage",
  "input",
  "output",
  "entrada",
  "bateria",
  "carregamento",
  "resfriamento",
  "resolução",
  "resolucao",
  "frequência",
  "frequencia",
  "potência",
  "potencia",
  "tamanho",
];

function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeText(value: string) {
  return normalizeSpaces(value).toLowerCase();
}

function isLikelySpecLine(name: string) {
  const lower = normalizeText(name);
  return BAD_NAME_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

function looksTooGeneric(name: string) {
  const lower = normalizeText(name);

  const blockedExact = new Set([
    "peso",
    "peso bruto",
    "peso líquido",
    "peso liquido",
    "temperatura",
    "voltagem",
    "tensão",
    "tensao",
    "cor",
    "cores",
    "saída",
    "saida",
    "canal",
    "modo",
    "função",
    "funcao",
    "material",
    "capacidade",
    "altura",
    "largura",
    "comprimento",
    "dimensões",
    "dimensoes",
    "dimensão",
    "dimensao",
    "lumens",
    "lúmens",
    "consumo",
    "interface",
    "interfaces",
    "promoção",
    "promocao",
    "saiba mais",
  ]);

  if (blockedExact.has(lower)) return true;
  if (lower.length < 3) return true;
  if (/^\d+[.,]?\d*$/.test(lower)) return true;

  return false;
}

function keyOf(item: ParsedCatalogRow) {
  return `${(item.sku || "").toLowerCase()}::${normalizeText(item.productName)}`;
}

function score(item: ParsedCatalogRow) {
  let s = 0;

  if (item.productName.length >= 4) s += 2;
  if (item.supplierCost && item.supplierCost > 0) s += 3;
  if (item.sku) s += 2;
  if (item.confidence >= 0.8) s += 2;
  if (item.unitPrice) s += 1;
  if (item.boxPrice) s += 1;
  if (item.unitsPerBox) s += 1;
  if (isLikelySpecLine(item.productName)) s -= 5;
  if (looksTooGeneric(item.productName)) s -= 5;

  return s;
}

function cleanItem(item: ParsedCatalogRow): ParsedCatalogRow {
  return {
    ...item,
    sku: item.sku ? normalizeSpaces(item.sku) : null,
    model: item.model ? normalizeSpaces(item.model) : item.sku ? normalizeSpaces(item.sku) : null,
    brand: item.brand ? normalizeSpaces(item.brand) : null,
    category: item.category ? normalizeSpaces(item.category) : null,
    productName: normalizeSpaces(item.productName),
    supplierCost:
      typeof item.supplierCost === "number" && item.supplierCost > 0
        ? Number(item.supplierCost.toFixed(2))
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
        ? Math.floor(item.unitsPerBox)
        : null,
    specs: (item.specs || []).map(normalizeSpaces).filter(Boolean).slice(0, 6),
    notes: item.notes ? normalizeSpaces(item.notes) : null,
    confidence:
      typeof item.confidence === "number" && Number.isFinite(item.confidence)
        ? Math.max(0, Math.min(1, item.confidence))
        : 0,
  };
}

export function validateAndNormalizeCatalogItems(
  items: ParsedCatalogRow[],
  maxRows = Number(process.env.CATALOG_MAX_ROWS_PER_JOB || "400")
): ParsedCatalogRow[] {
  const cleaned = items
    .map(cleanItem)
    .filter((item) => item.productName.length >= 3)
    .filter((item) => !isLikelySpecLine(item.productName))
    .filter((item) => !looksTooGeneric(item.productName))
    .filter((item) => item.supplierCost !== null && item.supplierCost > 0)
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
        score(b) - score(a) ||
        a.productName.localeCompare(b.productName)
    )
    .slice(0, maxRows);
}




