export type CatalogRiskLevel = "baixo" | "moderado" | "alto";

export type ParsedCatalogRow = {
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

export type CatalogAnalysisRow = {
  sku: string | null;
  model: string | null;
  brand: string | null;
  category: string | null;
  productName: string;
  supplierCost: number;
  unitPrice: number | null;
  boxPrice: number | null;
  unitsPerBox: number | null;
  specs: string[];
  notes: string | null;
  riskLevel: CatalogRiskLevel;
  worthBuying: boolean;
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
  aiSummary: string;
};

export type CatalogSummary = {
  totalRows: number;
  parsedRows: number;
  promisingCount: number;
  reviewCount: number;
  riskyCount: number;
  avgMargin: number;
  avgOpportunity: number;
  extractedTextPreview: string;
  highlights: string[];
  usedAI: boolean;
};

export type CatalogAnalysisResult = {
  fileName: string;
  mode: "structured" | "manual_review";
  aiSummary: CatalogSummary;
  rows: CatalogAnalysisRow[];
};
