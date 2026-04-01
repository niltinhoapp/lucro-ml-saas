export type CatalogStructuredItem = {
  sku?: string | null;
  titulo?: string | null;
  descricao?: string | null;
  marca?: string | null;
  categoria?: string | null;
  gtin?: string | null;
  ncm?: string | null;
  preco?: number | null;
  custo?: number | null;
  estoque?: number | null;
  variacoes?: string[] | null;
  imagens?: string[] | null;
};

export type CatalogStructuredResult = {
  items: CatalogStructuredItem[];
  warnings?: string[];
  source?: "cache" | "ai";
};

