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

export async function saveRadarSearch(input: SaveRadarSearchInput) {
  const supabase = await createServerClient();

  const { error } = await supabase.from("radar_searches").insert({
    user_id: input.userId,
    query: input.query,
    site_id: input.siteId ?? "MLB",
    category_id: input.categoryId ?? null,
    category_name: input.categoryName ?? null,
    demand_score: Math.round(input.demandScore ?? 0),
    competition_score: Math.round(input.competitionScore ?? 0),
    opportunity_score: Math.round(input.opportunityScore ?? 0),
    active_listings: Math.round(input.activeListings ?? 0),
    unique_sellers: Math.round(input.uniqueSellers ?? 0),
    avg_price: Number(input.avgPrice ?? 0),
    top_opportunity: input.topOpportunity ?? null,
    payload: input.payload ?? {},
  });

  if (error) {
    throw error;
  }
}