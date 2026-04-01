import { unstable_cache } from "next/cache";
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
  strategy_reads:
    | Array<{
        read_at: string | null;
        user_id: string;
      }>
    | null;
};

type RecommendationRow = {
  id: string;
  strategy_id: string | null;
  reason: string;
  score: number | string;
  strategies:
    | {
        title: string;
      }
    | {
        title: string;
      }[]
    | null;
};

const getCachedStrategies = unstable_cache(
  async (userId: string): Promise<Strategy[]> => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("strategies")
      .select(
        `
        id,
        slug,
        title,
        category,
        summary,
        content,
        estimated_read_minutes,
        plan_required,
        strategy_reads!left(read_at, user_id)
      `
      )
      .eq("is_published", true)
      .eq("strategy_reads.user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return ((data ?? []) as StrategyRow[]).map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      category: item.category,
      summary: item.summary,
      content: Array.isArray(item.content) ? item.content : [],
      estimatedReadMinutes: item.estimated_read_minutes ?? 3,
      planRequired: item.plan_required ?? "pro",
      isRead: Boolean(item.strategy_reads?.[0]?.read_at),
      readAt: item.strategy_reads?.[0]?.read_at ?? null,
    }));
  },
  ["strategies-by-user"],
  {
    revalidate: 300,
    tags: ["strategies"],
  }
);

export async function getStrategiesForUser(userId: string): Promise<Strategy[]> {
  return getCachedStrategies(userId);
}

export async function getRecommendationsForUser(
  userId: string
): Promise<StrategyRecommendation[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("strategy_recommendations")
    .select(
      `
      id,
      strategy_id,
      reason,
      score,
      strategies(title)
    `
    )
    .eq("user_id", userId)
    .order("score", { ascending: false })
    .limit(3);

  if (error) {
    throw error;
  }

  return ((data ?? []) as RecommendationRow[]).map((item) => {
    const strategyTitle = Array.isArray(item.strategies)
      ? item.strategies[0]?.title
      : item.strategies?.title;

    return {
      id: item.id,
      strategyId: item.strategy_id,
      title: strategyTitle ?? "Sugestão personalizada",
      reason: item.reason,
      score: Number(item.score ?? 0),
    };
  });
}