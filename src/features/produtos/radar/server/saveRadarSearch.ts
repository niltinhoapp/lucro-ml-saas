import { createServerClient } from "@/integrations/supabase/server";

type SaveRadarSearchInput = {
  userId: string;
  query: string;
  siteId?: string;
  categoryId?: string | null;
  categoryName?: string | null;
  avgPrice?: number | null;
  demandScore?: number | null;
  competitionScore?: number | null;
  opportunityScore?: number | null;
  activeListings?: number | null;
  uniqueSellers?: number | null;
  topOpportunity?: unknown;
  payload?: unknown;
};

function toSafeNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toRoundedInt(value: unknown, fallback = 0) {
  return Math.round(toSafeNumber(value, fallback));
}

function toMoney(value: unknown, fallback = 0) {
  return Number(toSafeNumber(value, fallback).toFixed(2));
}

function normalizeQuery(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export async function saveRadarSearch(input: SaveRadarSearchInput) {
  const supabase = await createServerClient();

  const query = normalizeQuery(input.query);

  if (!input.userId) {
    throw new Error("userId é obrigatório para salvar histórico do radar.");
  }

  if (!query) {
    throw new Error("query é obrigatória para salvar histórico do radar.");
  }

  const row = {
    user_id: input.userId,
    query,
    site_id: input.siteId ?? "MLB",
    category_id: input.categoryId ?? null,
    category_name: input.categoryName ?? null,
    demand_score: toRoundedInt(input.demandScore),
    competition_score: toRoundedInt(input.competitionScore),
    opportunity_score: toRoundedInt(input.opportunityScore),
    active_listings: toRoundedInt(input.activeListings),
    unique_sellers: toRoundedInt(input.uniqueSellers),
    avg_price: toMoney(input.avgPrice),
    top_opportunity: input.topOpportunity ?? null,
    payload: input.payload ?? {},
  };

  const { error } = await supabase.from("radar_searches").insert(row);

  if (error) {
    throw new Error(`Falha ao salvar radar_searches: ${error.message}`);
  }

  return row;
}
