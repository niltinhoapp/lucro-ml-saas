import { NextResponse } from "next/server";
import { createServerClient } from "@/integrations/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    if (!id?.trim()) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const supabase = await createServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    const { data: rel, error: relErr } = await supabase
      .from("caixa_relatorios")
      .select("id, nome, arquivo_nome, created_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (relErr || !rel) {
      return NextResponse.json({ error: "Relatório não encontrado." }, { status: 404 });
    }

    const { data: lanc, error: lancErr } = await supabase
      .from("caixa_lancamentos")
      .select(
        "id, release_date, transaction_type, description, amount, balance, direction, categoria"
      )
      .eq("relatorio_id", id)
      .eq("user_id", user.id)
      .order("release_date", { ascending: true })
      .order("id", { ascending: true });

    if (lancErr) {
      return NextResponse.json({ error: "Erro ao buscar lançamentos." }, { status: 500 });
    }

    return NextResponse.json({
      relatorio: rel,
      lancamentos: lanc ?? [],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno ao buscar relatório.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}



