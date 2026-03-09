import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // 👈 params como Promise
) {
  const { id } = await ctx.params; // ✅ unwrap

  if (!id) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  // 1) relatório
  const { data: rel, error: relErr } = await supabase
    .from("caixa_relatorios")
    .select("id, nome, arquivo_nome, created_at")
    .eq("id", id)
    .single();

  if (relErr || !rel) {
    return NextResponse.json({ error: "Relatório não encontrado." }, { status: 404 });
  }

  // 2) lançamentos
  const { data: lanc, error: lancErr } = await supabase
    .from("caixa_lancamentos")
    .select("id, release_date, transaction_type, description, amount, balance, direction, categoria")
    .eq("relatorio_id", id)
    .order("release_date", { ascending: true })
    .order("id", { ascending: true });

  if (lancErr) {
    return NextResponse.json({ error: "Erro ao buscar lançamentos." }, { status: 500 });
  }

  return NextResponse.json({
    relatorio: rel,
    lancamentos: lanc ?? [],
  });
}
