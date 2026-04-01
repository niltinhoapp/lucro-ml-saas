import { createServerClient } from "@/integrations/supabase/server";
import { generateRadarRecommendation } from "@/features/strategies/server/generateRadarRecommendation";
import type {
  Strategy,
  StrategyRecommendation,
  StrategySection,
} from "@/features/strategies/types";

type StrategyRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  content: StrategySection[] | null;
  access_level: "pro" | "plus";
  published_at: string | null;
};

type StrategyReadRow = {
  strategy_id: string;
  read_at: string | null;
};

type RadarSearchRow = {
  id: string;
  query: string;
  demand_score: number;
  competition_score: number;
  opportunity_score: number;
  created_at: string;
};

export async function getStrategiesForUser(userId: string): Promise<Strategy[]> {
  const supabase = await createServerClient();

  const [
    { data: strategies, error: strategiesError },
    { data: reads, error: readsError },
  ] = await Promise.all([
    supabase
      .from("strategies")
      .select("id, slug, title, category, summary, content, access_level, published_at")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false }),
    supabase
      .from("user_strategy_reads")
      .select("strategy_id, read_at")
      .eq("user_id", userId),
  ]);

  if (strategiesError) throw strategiesError;
  if (readsError) throw readsError;

  const readsMap = new Map<string, string | null>();

  ((reads ?? []) as StrategyReadRow[]).forEach((item) => {
    readsMap.set(item.strategy_id, item.read_at);
  });

  return ((strategies ?? []) as StrategyRow[]).map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    category: item.category,
    summary: item.summary,
    content: Array.isArray(item.content) ? item.content : [],
    estimatedReadMinutes: 3,
    planRequired: item.access_level === "plus" ? "plus" : "pro",
    isRead: readsMap.has(item.id) && Boolean(readsMap.get(item.id)),
    readAt: readsMap.get(item.id) ?? null,
  }));
}

export async function getRecommendationsForUser(
  userId: string
): Promise<StrategyRecommendation[]> {
  const supabase = await createServerClient();

  const { data: recentSearches, error } = await supabase
    .from("radar_searches")
    .select("id, query, demand_score, competition_score, opportunity_score, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    throw error;
  }

  const searches = (recentSearches ?? []) as RadarSearchRow[];

  if (!searches.length) {
    return [];
  }

  const recommendations = await Promise.all(
    searches.map(async (search) => {
      const generated = await generateRadarRecommendation({
        userId,
        query: search.query,
        opportunityScore: Number(search.opportunity_score ?? 0),
        demandScore: Number(search.demand_score ?? 0),
        competitionScore: Number(search.competition_score ?? 0),
      });

      return {
        id: search.id,
        strategyId: generated.strategyId,
        title: generated.title,
        reason: generated.reason,
        score: generated.score,
      };
    })
  );

  const deduped = new Map<string, StrategyRecommendation>();

  for (const item of recommendations) {
    const key = item.strategyId ?? item.title;

    if (!deduped.has(key)) {
      deduped.set(key, item);
    }
  }

  return [...deduped.values()].sort((a, b) => b.score - a.score).slice(0, 3);
}


