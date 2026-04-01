// src/app/api/ai/price-suggest/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Input = {
  custo_produto: number;
  logistica: number;
  taxa_percent?: number; // 0.16 = 16%
  margem_alvo?: number;  // 0.20 = 20%
  preco_atual?: number | null;
  preco_mercado?: number | null;
  dre?: {
    receitaTotal: number;
    taxas: number;
  };
};

function asNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isInput(x: unknown): x is Input {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return "custo_produto" in o && "logistica" in o;
}

export async function POST(req: Request) {
  try {
    const raw: unknown = await req.json().catch(() => ({}));
    if (!isInput(raw)) {
      return NextResponse.json(
        { ok: false, message: "Payload inválido. Envie custo_produto e logistica." },
        { status: 400 }
      );
    }

    const body: Input = raw;

    const custoProduto = asNum(body.custo_produto);
    const logistica = asNum(body.logistica);
    const custoTotal = custoProduto + logistica;

    let margemAlvo = asNum(body.margem_alvo ?? 0.2);
    margemAlvo = clamp(margemAlvo, 0, 0.6);

    let taxaPercent = asNum(body.taxa_percent);

    if (!taxaPercent && body.dre?.receitaTotal) {
      const receita = asNum(body.dre.receitaTotal);
      const taxas = asNum(body.dre.taxas);
      if (receita > 0) taxaPercent = taxas / receita;
    }

    if (!taxaPercent) taxaPercent = 0.16;
    taxaPercent = clamp(taxaPercent, 0.05, 0.35);

    if (custoTotal <= 0) {
      return NextResponse.json(
        { ok: false, message: "Custo total inválido (custo_produto + logistica precisa ser > 0)." },
        { status: 400 }
      );
    }

    const denomMin = 1 - taxaPercent;
    const denomAlvo = 1 - taxaPercent - margemAlvo;

    if (denomMin <= 0.01) {
      return NextResponse.json(
        { ok: false, message: "Taxa muito alta para calcular preço mínimo." },
        { status: 400 }
      );
    }

    if (denomAlvo <= 0.01) {
      return NextResponse.json(
        { ok: false, message: "Taxa + margem alvo muito alta. Reduza a margem alvo ou revise a taxa." },
        { status: 400 }
      );
    }

    const precoMin = custoTotal / denomMin;
    const precoAlvo = custoTotal / denomAlvo;

    const precoAtual = body.preco_atual == null ? null : asNum(body.preco_atual);
    const precoMercado = body.preco_mercado == null ? null : asNum(body.preco_mercado);

    let precoCompetitivo = precoAlvo;

    if (precoMercado && precoMercado > 0) {
      const alvoCompetitivo = precoMercado * 0.985;
      precoCompetitivo = Math.max(precoMin, Math.min(alvoCompetitivo, precoAlvo));
    }

    const data = {
      custo_total: Number(custoTotal.toFixed(2)),
      taxa_percent: Number((taxaPercent * 100).toFixed(2)),
      margem_alvo_percent: Number((margemAlvo * 100).toFixed(0)),
      preco_min: Number(precoMin.toFixed(2)),
      preco_alvo: Number(precoAlvo.toFixed(2)),
      preco_competitivo: Number(precoCompetitivo.toFixed(2)),
      comparativo: {
        preco_atual: precoAtual && precoAtual > 0 ? Number(precoAtual.toFixed(2)) : null,
        preco_mercado: precoMercado && precoMercado > 0 ? Number(precoMercado.toFixed(2)) : null,
      },
      formula: "preço = custo_total / (1 - taxa - margem)",
    };

    return NextResponse.json({ ok: true, data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "erro";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

