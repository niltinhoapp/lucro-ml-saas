type XmlCell = string | number | null;
type XmlRow = Record<string, XmlCell>;

type ParseXmlCatalogResult = {
  kind: "xml";
  text: string;
  rows: XmlRow[];
  hasUsableText: boolean;
};

function normalizeXmlText(input: string): string {
  return (input || "")
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "\n")
    .replace(/\u0000/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripXmlTagsPreserveText(xml: string): string {
  return xml
    .replace(/<\?xml[\s\S]*?\?>/gi, " ")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function toMaybeNumber(value: string): XmlCell {
  const raw = (value || "").trim();
  if (!raw) return null;

  const hasLetters = /[a-zA-ZÀ-ÿ]/.test(raw);
  if (hasLetters) return raw;

  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw;

  const numberValue = Number(normalized);
  if (Number.isFinite(numberValue)) return numberValue;

  return raw;
}

function extractTagValue(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "i");
  const match = xml.match(regex);
  return match?.[1]?.trim() || null;
}

function extractRepeatedBlocks(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "gi");
  const matches = [...xml.matchAll(regex)];
  return matches.map((match) => match[0]);
}

function extractNfeRows(xml: string): XmlRow[] {
  const detBlocks = extractRepeatedBlocks(xml, "det");

  return detBlocks.map((block) => {
    const prodBlock = extractTagValue(block, "prod") || block;

    return {
      codigo: toMaybeNumber(extractTagValue(prodBlock, "cProd") || ""),
      nome: extractTagValue(prodBlock, "xProd"),
      ean: toMaybeNumber(extractTagValue(prodBlock, "cEAN") || ""),
      unidade: extractTagValue(prodBlock, "uCom"),
      quantidade: toMaybeNumber(extractTagValue(prodBlock, "qCom") || ""),
      custo: toMaybeNumber(extractTagValue(prodBlock, "vUnCom") || ""),
      total: toMaybeNumber(extractTagValue(prodBlock, "vProd") || ""),
      ncm: toMaybeNumber(extractTagValue(prodBlock, "NCM") || ""),
    };
  });
}

function extractGenericProductRows(xml: string): XmlRow[] {
  const candidateTags = ["product", "produto", "item", "prod"];

  for (const tag of candidateTags) {
    const blocks = extractRepeatedBlocks(xml, tag);
    if (!blocks.length) continue;

    const rows = blocks.map((block) => ({
      codigo: toMaybeNumber(
        extractTagValue(block, "codigo") ||
          extractTagValue(block, "code") ||
          extractTagValue(block, "id") ||
          extractTagValue(block, "cProd") ||
          ""
      ),
      nome:
        extractTagValue(block, "nome") ||
        extractTagValue(block, "name") ||
        extractTagValue(block, "descricao") ||
        extractTagValue(block, "description") ||
        extractTagValue(block, "xProd"),
      marca:
        extractTagValue(block, "marca") ||
        extractTagValue(block, "brand"),
      categoria:
        extractTagValue(block, "categoria") ||
        extractTagValue(block, "category"),
      custo: toMaybeNumber(
        extractTagValue(block, "custo") ||
          extractTagValue(block, "price") ||
          extractTagValue(block, "preco") ||
          extractTagValue(block, "valor") ||
          extractTagValue(block, "vUnCom") ||
          ""
      ),
      ean: toMaybeNumber(
        extractTagValue(block, "ean") ||
          extractTagValue(block, "gtin") ||
          extractTagValue(block, "cEAN") ||
          ""
      ),
    }));

    if (rows.length) return rows;
  }

  return [];
}

export async function parseXmlCatalog(
  buffer: Buffer
): Promise<ParseXmlCatalogResult> {
  try {
    const raw = normalizeXmlText(buffer.toString("utf-8"));

    if (!raw || !raw.startsWith("<")) {
      return {
        kind: "xml",
        text: "",
        rows: [],
        hasUsableText: false,
      };
    }

    const nfeRows = extractNfeRows(raw);
    const genericRows = nfeRows.length ? [] : extractGenericProductRows(raw);
    const rows = nfeRows.length ? nfeRows : genericRows;

    const plainText = stripXmlTagsPreserveText(raw).slice(0, 40000);

    const hasUsableText =
      (rows.length > 0 || plainText.length > 30) &&
      /[a-zA-ZÀ-ÿ]/.test(plainText);

    return {
      kind: "xml",
      text: plainText,
      rows,
      hasUsableText,
    };
  } catch (error) {
    console.error("[parseXmlCatalog] erro ao ler XML:", error);

    return {
      kind: "xml",
      text: "",
      rows: [],
      hasUsableText: false,
    };
  }
}