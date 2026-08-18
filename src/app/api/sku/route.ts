import { NextResponse } from "next/server";
import { createServerClient } from "@/integrations/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: authError?.message || "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("sku_custos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: "Erro ao buscar SKUs." }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao buscar SKUs.";
    console.error("[api/sku][GET] ERROR:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: authError?.message || "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const sku = String(body?.sku ?? "").trim();
    if (!sku) return NextResponse.json({ error: "SKU é obrigatório." }, { status: 400 });

    const payload = {
      user_id: user.id,
      sku,
      titulo: body?.titulo ?? null,
      custo_unitario: Number(body?.custo_unitario ?? 0),
      embalagem: Number(body?.embalagem ?? 0),
      imposto: Number(body?.imposto ?? 0),
      frete_medio: Number(body?.frete_medio ?? 0),
      ativo: body?.ativo ?? true,
    };

    // ATENÇÃO — dependência de migration ainda não aplicada em produção:
    // este onConflict usa o índice composto (user_id, sku) criado por
    // supabase/migrations/20260817_04_sku_custos_unique_per_user.sql.
    // Essa migration ainda NÃO foi aplicada em produção. Não fazer deploy
    // deste arquivo antes de aplicar a migration 04, ou todo POST vai
    // falhar (Postgres exige um unique/exclusion constraint real
    // correspondente às colunas do ON CONFLICT).
    // Ordem de rollout: aplicar migration 04 -> publicar este código ->
    // validar GET/POST -> aplicar migration 05 (remove o unique antigo
    // em `sku` isolado, mantido intacto até lá).
    const { data, error } = await supabase
      .from("sku_custos")
      .upsert(payload, { onConflict: "user_id,sku" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Erro ao salvar SKU." }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar SKU.";
    console.error("[api/sku][POST] ERROR:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
