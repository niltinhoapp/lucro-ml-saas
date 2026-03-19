
import { NextResponse } from "next/server";
import { apiError, validatePlusRadarAccess } from "../_shared";

export async function GET() {
  try {
    const { supabase, user, error } = await validatePlusRadarAccess();
    if (error || !user) return error!;

    const { data, error: dbError } = await supabase
      .from("radar_searches")
      .select("id, query, category_name, opportunity_score, demand_score, competition_score, active_listings, unique_sellers, avg_price, top_opportunity, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12);

    if (dbError) throw dbError;
    return NextResponse.json({ ok: true, items: data ?? [] });
  } catch (error) {
    return apiError("Não foi possível carregar o histórico.", error);
  }
}
