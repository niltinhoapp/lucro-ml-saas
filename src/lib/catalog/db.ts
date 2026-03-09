export type CatalogDbSummary = {
  id: string;
  title: string;
  file_name: string | null;
  status: string;
  source_type: string;
  items_count: number;
  parsed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CatalogDbItem = {
  id: string;
  raw_name: string;
  normalized_name: string | null;
  supplier_sku: string | null;
  brand: string | null;
  category: string | null;
  supplier_cost: number;
  min_qty: number | null;
  unit: string | null;
  notes: string | null;
  raw_data: Record<string, unknown>;
  created_at: string;
};

export type CatalogDbAnalysis = {
  id: string;
  item_id: string;
  ml_search_term: string | null;
  ml_price_avg: number | null;
  ml_price_min: number | null;
  ml_price_max: number | null;
  estimated_fees: number;
  estimated_shipping: number;
  estimated_margin: number;
  estimated_profit: number;
  demand_score: number;
  competition_score: number;
  opportunity_score: number;
  risk_level: string | null;
  analysis: Record<string, unknown>;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
};
