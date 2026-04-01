// src/app/api/ai/produtos-rank/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LinhaVenda = {
  produto: string;
  receita: number;
  custo: number;
  taxa: number;
  logistica: number;
  data?: string;
};

type Input = {
  linhas: LinhaVenda[];
  top_n?: number;
};

type ProdutoAgg = {
  produto: string;
  qtd: number;
  receita: number;
  custo: number;
  taxa: number;
  logistica: number;
  lucro: number;
  margem_percent: number;
  taxa_percent: number;
  logistica_percent: number;
};

function asNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object";
}

function isLinhaVenda(x: unknown): x is LinhaVenda {
  if (!isRecord(x)) return false;
  return "produto" in x && "receita" in x && "custo" in x && "taxa" in x && "logistica" in x;
}

function normalizeProduto(p: string) {
  return (p ?? "").trim().replace(/\s+/g, " ");
}

function round2(n: number) {
  return Number(n.toFixed(2));
}

function aggregate(linhas: LinhaVenda[]): ProdutoAgg[] {
  const map = new Map<string, ProdutoAgg>();

  for (const l of linhas) {
    const produto = normalizeProduto(String(l.produto ?? ""));
    if (!produto) continue;

    const receita = asNum(l.receita);
    const custo = asNum(l.custo);
    const taxa = asNum(l.taxa);
    const logistica = asNum(l.logistica);

    const cur =
      map.get(produto) ??
      ({
        produto,
        qtd: 0,
        receita: 0,
        custo: 0,
        taxa: 0,
        logistica: 0,
        lucro: 0,
        margem_percent: 0,
        taxa_percent: 0,
        logistica_percent: 0,
      } as ProdutoAgg);

    cur.qtd += 1;
    cur.receita += receita;
    cur.custo += custo;
    cur.taxa += taxa;
    cur.logistica += logistica;

    map.set(produto, cur);
  }

  const out: ProdutoAgg[] = [];
  for (const v of map.values()) {
    const lucro = v.receita - v.custo - v.taxa - v.logistica;
    const margem = v.receita > 0 ? (lucro / v.receita) * 100 : 0;
    const taxaPct = v.receita > 0 ? (v.taxa / v.receita) * 100 : 0;
    const logPct = v.receita > 0 ? (v.logistica / v.receita) * 100 : 0;

    out.push({
      ...v,
      receita: round2(v.receita),
      custo: round2(v.custo),
      taxa: round2(v.taxa),
      logistica: round2(v.logistica),
      lucro: round2(lucro),
      margem_percent: round2(margem),
      taxa_percent: round2(taxaPct),
      logistica_percent: round2(logPct),
    });
  }

  return out;
}

export async function POST(req: Request) {
  try {
    const raw: unknown = await req.json().catch(() => ({}));
    if (!isRecord(raw) || !("linhas" in raw) || !Array.isArray(raw.linhas)) {
      return NextResponse.json({ ok: false, message: "Envie { linhas: LinhaVenda[] }." }, { status: 400 });
    }

    const linhasRaw = raw.linhas as unknown[];
    const linhas = linhasRaw.filter(isLinhaVenda);

    if (linhas.length === 0) {
      return NextResponse.json({ ok: false, message: "Nenhuma linha válida encontrada." }, { status: 400 });
    }

    const topN = Math.max(3, Math.min(20, asNum("top_n" in raw ? raw.top_n : 8) || 8));

    const aggs = aggregate(linhas);

    const topLucro = [...aggs].sort((a, b) => b.lucro - a.lucro).slice(0, topN);
    const topPrejuizo = [...aggs].sort((a, b) => a.lucro - b.lucro).slice(0, topN);
    const topTaxa = [...aggs].sort((a, b) => b.taxa_percent - a.taxa_percent).slice(0, topN);
    const topLogistica = [...aggs].sort((a, b) => b.logistica_percent - a.logistica_percent).slice(0, topN);

    return NextResponse.json({
      ok: true,
      data: {
        total_produtos: aggs.length,
        top_n: topN,
        top_lucro: topLucro,
        top_prejuizo: topPrejuizo,
        top_taxa: topTaxa,
        top_logistica: topLogistica,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "erro";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}




