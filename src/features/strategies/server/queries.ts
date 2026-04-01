import { createServerClient } from "@/integrations/supabase/server";
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
  estimated_read_minutes: number;
  plan_required: "free" | "pro" | "plus";
};

type StrategyReadRow = {
  strategy_id: string;
  read_at: string | null;
};

type RecommendationRow = {
  id: string;
  strategy_id: string | null;
  reason: string;
  score: number | string;
  strategies: { title: string } | { title: string }[] | null;
};

export async function getStrategiesForUser(userId: string): Promise<Strategy[]> {
  const supabase = await createServerClient();

  const [
    { data: strategies, error: strategiesError },
    { data: reads, error: readsError },
  ] = await Promise.all([
    supabase
      .from("strategies")
      .select(
        "id, slug, title, category, summary, content, estimated_read_minutes, plan_required"
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("strategy_reads")
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
    estimatedReadMinutes: item.estimated_read_minutes ?? 3,
    planRequired: item.plan_required ?? "pro",
    isRead: readsMap.has(item.id) && Boolean(readsMap.get(item.id)),
    readAt: readsMap.get(item.id) ?? null,
  }));
}

export async function getRecommendationsForUser(
  userId: string
): Promise<StrategyRecommendation[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("strategy_recommendations")
    .select("id, strategy_id, reason, score, strategies(title)")
    .eq("user_id", userId)
    .order("score", { ascending: false })
    .limit(3);

  if (error) {
    throw error;
  }

  return ((data ?? []) as RecommendationRow[]).map((item) => {
    const title = Array.isArray(item.strategies)
      ? item.strategies[0]?.title
      : item.strategies?.title;

    return {
      id: item.id,
      strategyId: item.strategy_id,
      title: title ?? "Sugestão personalizada",
      reason: item.reason,
      score: Number(item.score ?? 0),
    };
  });
}
