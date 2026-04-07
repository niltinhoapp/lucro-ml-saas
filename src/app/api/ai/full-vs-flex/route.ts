// src/app/api/ai/full-vs-flex/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ModeInput = {
  taxa_percent: number;  // 0.16 = 16%
  logistica: number;     // custo total logístico daquele modo
  extra_custos?: number; // opcional
};

type Input = {
  receita_total: number;   // total vendido
  custo_produtos: number;  // custo total dos produtos
  full: ModeInput;
  flex: ModeInput;
};

function asNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object";
}

function isModeInput(x: unknown): x is ModeInput {
  if (!isRecord(x)) return false;
  return "taxa_percent" in x && "logistica" in x;
}

function isInput(x: unknown): x is Input {
  if (!isRecord(x)) return false;

  if (!("receita_total" in x) || !("custo_produtos" in x) || !("full" in x) || !("flex" in x)) {
    return false;
  }

  const full = x.full;
  const flex = x.flex;

  return isModeInput(full) && isModeInput(flex);
}

function calcMode(receitaTotal: number, custoProdutos: number, mode: ModeInput) {
  const taxa = clamp(asNum(mode.taxa_percent), 0.05, 0.35);
  const logistica = Math.max(0, asNum(mode.logistica));
  const extra = Math.max(0, asNum(mode.extra_custos ?? 0));

  const taxasValor = receitaTotal * taxa;
  const lucro = receitaTotal - custoProdutos - taxasValor - logistica - extra;
  const margem = receitaTotal > 0 ? (lucro / receitaTotal) * 100 : 0;

  return {
    taxa_percent: Number((taxa * 100).toFixed(2)), // em %
    taxas_valor: Number(taxasValor.toFixed(2)),
    logistica: Number(logistica.toFixed(2)),
    extra_custos: Number(extra.toFixed(2)),
    lucro: Number(lucro.toFixed(2)),
    margem: Number(margem.toFixed(2)),
  };
}

export async function POST(req: Request) {
  try {
    const raw: unknown = await req.json().catch(() => ({}));

    if (!isInput(raw)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Payload inválido. Envie receita_total, custo_produtos, full{taxa_percent,logistica}, flex{taxa_percent,logistica}.",
        },
        { status: 400 }
      );
    }

    const body: Input = raw;

    const receitaTotal = Math.max(0, asNum(body.receita_total));
    const custoProdutos = Math.max(0, asNum(body.custo_produtos));

    if (receitaTotal <= 0) {
      return NextResponse.json({ ok: false, message: "receita_total precisa ser > 0." }, { status: 400 });
    }

    const full = calcMode(receitaTotal, custoProdutos, body.full);
    const flex = calcMode(receitaTotal, custoProdutos, body.flex);

    let recomendacao: "FULL" | "FLEX" | "INDIFERENTE" = "INDIFERENTE";
    let motivo = "";

    const diffLucro = full.lucro - flex.lucro;
    const diffMargem = full.margem - flex.margem;

    if (Math.abs(diffLucro) < 0.01 && Math.abs(diffMargem) < 0.01) {
      recomendacao = "INDIFERENTE";
      motivo = "Os dois modos ficaram praticamente iguais em lucro e margem.";
    } else if (full.lucro > flex.lucro) {
      recomendacao = "FULL";
      motivo = `FULL gera mais lucro (+R$ ${Math.abs(diffLucro).toFixed(2)}).`;
    } else if (flex.lucro > full.lucro) {
      recomendacao = "FLEX";
      motivo = `FLEX gera mais lucro (+R$ ${Math.abs(diffLucro).toFixed(2)}).`;
    } else if (full.margem > flex.margem) {
      recomendacao = "FULL";
      motivo = `Lucro igual, mas FULL tem margem maior (+${Math.abs(diffMargem).toFixed(2)} p.p.).`;
    } else {
      recomendacao = "FLEX";
      motivo = `Lucro igual, mas FLEX tem margem maior (+${Math.abs(diffMargem).toFixed(2)} p.p.).`;
    }

    const warnings: string[] = [];
    if (full.lucro < 0) warnings.push("FULL está dando prejuízo com esses números.");
    if (flex.lucro < 0) warnings.push("FLEX está dando prejuízo com esses números.");
    if (full.taxa_percent > 25) warnings.push("Taxa do FULL está muito alta (revise).");
    if (flex.taxa_percent > 25) warnings.push("Taxa do FLEX está muito alta (revise).");

    return NextResponse.json({
      ok: true,
      data: {
        receita_total: Number(receitaTotal.toFixed(2)),
        custo_produtos: Number(custoProdutos.toFixed(2)),
        full,
        flex,
        recomendacao,
        motivo,
        warnings,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "erro";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}









