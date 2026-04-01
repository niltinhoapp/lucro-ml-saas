import { NextResponse } from "next/server";
import { createServerClient } from "@/integrations/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CaixaResumo = {
  id: string;
  nome: string | null;
  arquivo_nome: string | null;
  created_at: string | null;
  total_lancamentos: number;
  entradas_total: number;
  saidas_total: number;
  saldo_liquido: number;
  periodo_inicio: string | null;
  periodo_fim: string | null;
};

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

    const { data: relatorios, error: relError } = await supabase
      .from("caixa_relatorios")
      .select("id, nome, arquivo_nome, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (relError) {
      console.error("[api/caixa][GET] relatórios:", relError);
      return NextResponse.json({ error: relError.message }, { status: 500 });
    }

    const relatorioIds = (relatorios ?? []).map((item) => item.id);

    if (!relatorioIds.length) {
      return NextResponse.json([]);
    }

    const { data: lancamentos, error: lancError } = await supabase
      .from("caixa_lancamentos")
      .select("id, relatorio_id, release_date, amount")
      .eq("user_id", user.id)
      .in("relatorio_id", relatorioIds)
      .order("release_date", { ascending: true })
      .order("id", { ascending: true });

    if (lancError) {
      console.error("[api/caixa][GET] lançamentos:", lancError);
      return NextResponse.json({ error: lancError.message }, { status: 500 });
    }

    const grouped = new Map<string, CaixaResumo>();

    for (const rel of relatorios ?? []) {
      grouped.set(rel.id, {
        id: rel.id,
        nome: rel.nome,
        arquivo_nome: rel.arquivo_nome,
        created_at: rel.created_at,
        total_lancamentos: 0,
        entradas_total: 0,
        saidas_total: 0,
        saldo_liquido: 0,
        periodo_inicio: null,
        periodo_fim: null,
      });
    }

    for (const lanc of lancamentos ?? []) {
      const current = grouped.get(lanc.relatorio_id);
      if (!current) continue;

      const amount = Number(lanc.amount ?? 0);
      current.total_lancamentos += 1;

      if (amount >= 0) current.entradas_total += amount;
      else current.saidas_total += Math.abs(amount);

      current.saldo_liquido = current.entradas_total - current.saidas_total;

      if (lanc.release_date) {
        if (!current.periodo_inicio || lanc.release_date < current.periodo_inicio) {
          current.periodo_inicio = lanc.release_date;
        }
        if (!current.periodo_fim || lanc.release_date > current.periodo_fim) {
          current.periodo_fim = lanc.release_date;
        }
      }
    }

    return NextResponse.json(Array.from(grouped.values()));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao buscar relatórios de caixa.";

    console.error("[api/caixa][GET] ERROR:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}




