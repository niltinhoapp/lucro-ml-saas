
import { NextResponse } from "next/server";
import { apiError, validatePlusRadarAccess } from "../_shared";

type FavoriteBody = {
  action?: "save" | "remove";
  keyword?: string;
  title?: string;
  price?: number;
  opportunityScore?: number;
  soldQuantity?: number;
  competitionLevel?: string;
  permalink?: string | null;
  shipping?: string;
};

export async function GET() {
  try {
    const { supabase, user, error } = await validatePlusRadarAccess();
    if (error || !user) return error!;

    const { data, error: dbError } = await supabase
      .from("radar_favorites")
      .select("id, keyword, title, price, opportunity_score, sold_quantity, competition_level, permalink, shipping, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (dbError) throw dbError;

    return NextResponse.json({ ok: true, items: data ?? [] });
  } catch (error) {
    return apiError("Não foi possível carregar os favoritos.", error);
  }
}

export async function POST(req: Request) {
  try {
    const { supabase, user, error } = await validatePlusRadarAccess();
    if (error || !user) return error!;

    const body = (await req.json().catch(() => ({}))) as FavoriteBody;
    const action = body.action ?? "save";
    const keyword = String(body.keyword ?? "").trim();

    if (!keyword) {
      return NextResponse.json({ ok: false, error: "Keyword obrigatória." }, { status: 400 });
    }

    if (action === "remove") {
      const { error: removeError } = await supabase
        .from("radar_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("keyword", keyword);

      if (removeError) throw removeError;
      return NextResponse.json({ ok: true, action: "removed", keyword });
    }

    const payload = {
      user_id: user.id,
      keyword,
      title: String(body.title ?? keyword).trim(),
      price: Number(body.price ?? 0),
      opportunity_score: Number(body.opportunityScore ?? 0),
      sold_quantity: Number(body.soldQuantity ?? 0),
      competition_level: String(body.competitionLevel ?? "média"),
      permalink: body.permalink ?? null,
      shipping: String(body.shipping ?? "a validar"),
    };

    const { error: upsertError } = await supabase
      .from("radar_favorites")
      .upsert(payload, { onConflict: "user_id,keyword" });

    if (upsertError) throw upsertError;
    return NextResponse.json({ ok: true, action: "saved", keyword });
  } catch (error) {
    return apiError("Não foi possível atualizar os favoritos.", error);
  }
}

