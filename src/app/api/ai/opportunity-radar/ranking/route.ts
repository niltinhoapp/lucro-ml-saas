
import { NextResponse } from "next/server";
import { apiError, numberOrZero, validatePlusRadarAccess } from "../_shared";

type SearchRow = {
  id: string;
  query: string;
  created_at: string;
  top_opportunity: {
    title?: string;
    keyword?: string;
    price?: number;
    opportunityScore?: number;
    soldQuantity?: number;
    permalink?: string;
    competitionLevel?: string;
  } | null;
  opportunity_score: number | null;
};

type RankingAccumulator = {
  keyword: string;
  title: string;
  bestScore: number;
  seenCount: number;
  avgSearchScore: number;
  lastSeenAt: string;
  price: number;
  soldQuantity: number;
  permalink: string | null;
  competitionLevel: string;
};

function buildRanking(rows: SearchRow[]) {
  const byKeyword = new Map<string, RankingAccumulator>();

  for (const row of rows) {
    const top = row.top_opportunity;
    const keyword = top?.keyword?.trim() || row.query.trim();
    const itemScore = numberOrZero(top?.opportunityScore ?? row.opportunity_score);
    const searchScore = numberOrZero(row.opportunity_score);
    const existing = byKeyword.get(keyword);

    if (!existing) {
      byKeyword.set(keyword, {
        keyword,
        title: top?.title || row.query,
        bestScore: itemScore,
        seenCount: 1,
        avgSearchScore: searchScore,
        lastSeenAt: row.created_at,
        price: numberOrZero(top?.price),
        soldQuantity: numberOrZero(top?.soldQuantity),
        permalink: top?.permalink ?? null,
        competitionLevel: top?.competitionLevel ?? "média",
      });
      continue;
    }

    existing.seenCount += 1;
    existing.avgSearchScore = Number(
      ((existing.avgSearchScore * (existing.seenCount - 1) + searchScore) / existing.seenCount).toFixed(1)
    );

    if (itemScore >= existing.bestScore) {
      existing.bestScore = itemScore;
      existing.title = top?.title || existing.title;
      existing.price = numberOrZero(top?.price ?? existing.price);
      existing.soldQuantity = numberOrZero(top?.soldQuantity ?? existing.soldQuantity);
      existing.permalink = top?.permalink ?? existing.permalink;
      existing.competitionLevel = top?.competitionLevel ?? existing.competitionLevel;
    }

    if (row.created_at > existing.lastSeenAt) {
      existing.lastSeenAt = row.created_at;
    }
  }

  return [...byKeyword.values()]
    .sort((a, b) => b.bestScore - a.bestScore || b.seenCount - a.seenCount)
    .slice(0, 8);
}

export async function GET() {
  try {
    const { supabase, user, error } = await validatePlusRadarAccess();
    if (error || !user) return error!;

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error: dbError } = await supabase
      .from("radar_searches")
      .select("id, query, created_at, top_opportunity, opportunity_score")
      .eq("user_id", user.id)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(80);

    if (dbError) throw dbError;

    const rows = (data ?? []) as SearchRow[];
    const items = buildRanking(rows);

    return NextResponse.json({ ok: true, items, searchesLast7Days: rows.length });
  } catch (error) {
    return apiError("Não foi possível carregar o ranking.", error);
  }
}









