export type ParsedCatalogRow = {
  id: string;
  rawLine: string;
  productName: string;
  supplierCost: number;
  brand?: string | null;
  sku?: string | null;
  category?: string | null;
};

export type CatalogInsightTone = "good" | "warn" | "danger" | "info";

export type CatalogInsight = {
  title: string;
  text: string;
  tone: CatalogInsightTone;
};

export type CatalogAnalysisRow = ParsedCatalogRow & {
  mlPriceAvg: number;
  mlPriceMin: number;
  mlPriceMax: number;
  estimatedFees: number;
  estimatedShipping: number;
  estimatedProfit: number;
  estimatedMargin: number;
  demandScore: number;
  competitionScore: number;
  opportunityScore: number;
  riskLevel: "baixo" | "moderado" | "alto";
  summary: string;
};

export type CatalogAnalysisSummary = {
  totalRows: number;
  parsedRows: number;
  promisingCount: number;
  reviewCount: number;
  riskyCount: number;
  avgMargin: number;
  avgOpportunity: number;
  extractionQuality: "alta" | "media" | "baixa";
  extractedTextPreview: string;
  highlights: CatalogInsight[];
};

export type CatalogAnalysisResult = {
  fileName: string;
  mode: "structured" | "manual_review";
  summary: CatalogAnalysisSummary;
  rows: CatalogAnalysisRow[];
  savedCatalogId?: string | null;
  savedAt?: string | null;
};
