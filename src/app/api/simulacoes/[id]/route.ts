// src/app/api/simulacoes/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calcularDre, type LinhaVenda, type DreResultado } from "@/lib/dre/calcularDre";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const supabase = createClient(
  mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
  mustEnv("SUPABASE_SERVICE_ROLE_KEY") // server only
);

function asNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object";
}

type SimulacaoDados = {
  linhas?: LinhaVenda[];
  meta?: {
    avisos?: unknown;
    camposDetectados?: unknown;
    camposIgnorados?: unknown;
    sheetHeaders?: unknown;
    headersNormalizados?: unknown;
    totalLinhasBrutas?: unknown;
    totalLinhasValidas?: unknown;
    headerIdx?: unknown;
    sheetName?: unknown;
  };
};

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

  dados: unknown | null; // jsonb
};

function parseDados(dados: unknown): SimulacaoDados {
  if (!isRecord(dados)) return {};
  return dados as SimulacaoDados;
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    if (!id || id === "undefined") {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
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

    // DRE pelas colunas salvas
    const dreColunas: DreResultado = {
      receitaTotal: asNum(data.receita_total),
      custoProdutos: asNum(data.custo_produtos),
      taxas: asNum(data.taxas),
      logistica: asNum(data.logistica),
      lucro: asNum(data.lucro),
      margem: asNum(data.margem),
    };

    const dados = parseDados(data.dados);
    const linhas = Array.isArray(dados.linhas) ? dados.linhas : [];

    // Se ficou tudo 0, tenta recalcular do jsonb linhas
    const dreTudoZero =
      dreColunas.receitaTotal === 0 &&
      dreColunas.custoProdutos === 0 &&
      dreColunas.taxas === 0 &&
      dreColunas.logistica === 0 &&
      dreColunas.lucro === 0 &&
      dreColunas.margem === 0;

    const dre = dreTudoZero && linhas.length > 0 ? calcularDre(linhas) : dreColunas;

    const meta = isRecord(dados.meta) ? (dados.meta as Record<string, unknown>) : {};

    return NextResponse.json({
      id: data.id,
      nome: data.nome,
      arquivo_nome: data.arquivo_nome,
      created_at: data.created_at,
      origem: data.origem,

      dre,

      // ✅ Item 5 precisa disso:
      linhas: linhas.length > 0 ? linhas : null,

      // diagnóstico / warnings
      avisos: Array.isArray(meta.avisos) ? meta.avisos : [],
      camposDetectados: (meta.camposDetectados ?? null) as unknown,
      camposIgnorados: (meta.camposIgnorados ?? null) as unknown,

      sheetHeaders: (meta.sheetHeaders ?? null) as unknown,
      headersNormalizados: (meta.headersNormalizados ?? null) as unknown,

      totalLinhasBrutas: meta.totalLinhasBrutas ?? null,
      totalLinhasValidas: meta.totalLinhasValidas ?? null,
      headerIdx: meta.headerIdx ?? null,
      sheetName: meta.sheetName ?? null,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro desconhecido." },
      { status: 500 }
    );
  }
}