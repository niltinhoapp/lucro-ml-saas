import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Dre = {
  receitaTotal: number;
  custoProdutos: number;
  taxas: number;
  logistica: number;
  lucro: number;
  margem: number; // %
};

type Body = { dre?: Dre };

function asNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const dre = body.dre;

    if (!dre) {
      return NextResponse.json({ ok: false, message: "dre ausente" }, { status: 400 });
    }

    const receita = Math.max(0, asNum(dre.receitaTotal));
    const custo = Math.max(0, asNum(dre.custoProdutos));
    const taxas = Math.max(0, asNum(dre.taxas));
    const log = Math.max(0, asNum(dre.logistica));
    const lucro = asNum(dre.lucro);
    const margem = asNum(dre.margem);

    const taxaPct = receita > 0 ? (taxas / receita) * 100 : 0;
    const logPct = receita > 0 ? (log / receita) * 100 : 0;
    const custoPct = receita > 0 ? (custo / receita) * 100 : 0;

    // score (0..100) baseado em margem/lucro/taxas/logística
    let score = 0;

    // margem pesa mais
    if (margem >= 15) score += 45;
    else if (margem >= 8) score += 30;
    else score += 12;

    // lucro
    if (lucro >= 0) score += 25;
    else score += 5;

    // taxas
    if (taxaPct <= 16) score += 15;
    else if (taxaPct <= 20) score += 10;
    else score += 4;

    // logística
    if (logPct <= 12) score += 15;
    else if (logPct <= 18) score += 10;
    else score += 4;

    score = clamp(score, 0, 100);

    // status (o componente espera)
    let status: "OK" | "ATENCAO" | "RISCO" | "PREJUIZO" = "OK";
    if (lucro < 0) status = "PREJUIZO";
    else if (score < 50 || margem < 8) status = "RISCO";
    else if (score < 75 || margem < 15) status = "ATENCAO";
    else status = "OK";

    const flags: string[] = [];
    if (lucro < 0) flags.push("prejuizo");
    if (margem < 8) flags.push("margem_muito_baixa");
    if (margem >= 8 && margem < 15) flags.push("margem_baixa");
    if (taxaPct > 18) flags.push("taxas_altas");
    if (logPct > 16) flags.push("logistica_alta");
    if (custoPct > 60) flags.push("custo_produto_alto");

    const actions: string[] = [];
    if (lucro < 0) actions.push("Ajuste o preço mínimo para sair do prejuízo (considerando taxas + logística).");
    if (margem < 8) actions.push("Suba margem: aumente preço ou reduza custo do produto e logística.");
    if (taxaPct > 18) actions.push("Revise taxas: categoria/anúncio, promoções e repasse no preço.");
    if (logPct > 16) actions.push("Otimize logística: embalagem, dimensões/peso e modo (Full/Flex).");
    if (!actions.length) actions.push("Cenário saudável: teste melhorias pequenas para aumentar margem com segurança.");

    const summary =
      status === "OK"
        ? "Seu DRE está saudável. Margem e custos dentro de um cenário seguro."
        : status === "ATENCAO"
        ? "Seu DRE está ok, mas dá pra melhorar margem e/ou custos."
        : status === "RISCO"
        ? "Atenção: sua operação está com risco elevado (margem baixa ou custos altos)."
        : "Prejuízo detectado: ajuste preço/custos/taxas/logística antes de escalar.";

    return NextResponse.json({
      ok: true,
      data: {
        score,
        status,
        flags,
        metrics: {
          taxa_percent: Number(taxaPct.toFixed(2)),
          logistica_percent: Number(logPct.toFixed(2)),
          custo_percent: Number(custoPct.toFixed(2)),
          margem_percent: Number(margem.toFixed(2)),
        },
        actions,
        summary,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "erro";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

