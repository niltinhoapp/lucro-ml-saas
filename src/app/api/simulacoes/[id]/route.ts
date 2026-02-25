// src/app/api/simulacoes/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calcularDre } from "@/lib/dre/calcularDre";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
);

type SimulacaoDb = {
  id: string;
  nome: string | null;
  arquivo_nome: string | null;

  receita_total: number | null;
  custo_produtos: number | null;
  taxas: number | null;
  logistica: number | null;
  lucro: number | null;
  margem: number | null;

  created_at: string | null;
  origem: string | null;

  dados: any | null; // jsonb (linhas + meta)
};

function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "ID não informado." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("simulacoes")
      .select(
        [
          "id",
          "nome",
          "arquivo_nome",
          "receita_total",
          "custo_produtos",
          "taxas",
          "logistica",
          "lucro",
          "margem",
          "created_at",
          "origem",
          "dados",
        ].join(",")
      )
      .eq("id", id)
      .single<SimulacaoDb>();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Simulação não encontrada." },
        { status: 404 }
      );
    }

    // tenta montar o DRE a partir das colunas já salvas
    const dreColunas = {
      receitaTotal: num(data.receita_total),
      custoProdutos: num(data.custo_produtos),
      taxas: num(data.taxas),
      logistica: num(data.logistica),
      lucro: num(data.lucro),
      margem: num(data.margem),
    };

    // se por algum motivo ficou tudo 0 (ou não existe), tenta recalcular do jsonb linhas
    let dre = dreColunas;

    const linhas = data.dados?.linhas;
    const hasLinhas = Array.isArray(linhas) && linhas.length > 0;

    const dreTudoZero =
      dre.receitaTotal === 0 &&
      dre.custoProdutos === 0 &&
      dre.taxas === 0 &&
      dre.logistica === 0 &&
      dre.lucro === 0 &&
      dre.margem === 0;

    if (dreTudoZero && hasLinhas) {
      // linhas precisam ter formato LinhaVenda: { data, produto, receita, custo, taxa, logistica }
      dre = calcularDre(linhas);
    }

    // meta/diagnóstico (salvos no upload-planilha)
    const meta = data.dados?.meta ?? {};

    return NextResponse.json({
      id: data.id,
      nome: data.nome,
      arquivo_nome: data.arquivo_nome,
      created_at: data.created_at,
      origem: data.origem,

      dre,

      // diagnóstico / warnings (para sua UI)
      avisos: Array.isArray(meta?.avisos) ? meta.avisos : [],
      camposDetectados: meta?.camposDetectados ?? null,
      camposIgnorados: meta?.camposIgnorados ?? null,

      sheetHeaders: meta?.sheetHeaders ?? null,
      headersNormalizados: meta?.headersNormalizados ?? null,

      totalLinhasBrutas: meta?.totalLinhasBrutas ?? null,
      totalLinhasValidas: meta?.totalLinhasValidas ?? null,
      headerIdx: meta?.headerIdx ?? null,
      sheetName: meta?.sheetName ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro desconhecido." },
      { status: 500 }
    );
  }
}
