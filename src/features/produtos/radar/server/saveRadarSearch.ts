import { createServerClient } from "@/integrations/supabase/server";

type SaveRadarSearchInput = {
  userId: string;
  query: string;
  avgPrice?: number | null;
  demandScore?: number | null;
  competitionScore?: number | null;
  opportunityScore?: number | null;
  payload?: unknown;
};

export async function saveRadarSearch(input: SaveRadarSearchInput) {
  const supabase = await createServerClient();

  const { error } = await supabase.from("radar_searches").insert({
    user_id: input.userId,
    query: input.query,
    avg_price: input.avgPrice ?? null,
    demand_score: input.demandScore ?? null,
    competition_score: input.competitionScore ?? null,
    opportunity_score: input.opportunityScore ?? null,
    payload: input.payload ?? null,
  });

  if (error) {
    throw error;
  }
}