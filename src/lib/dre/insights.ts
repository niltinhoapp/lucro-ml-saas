// src/lib/dre/insights.ts

export type DreResultado = {
  receitaTotal: number;
  custoProdutos: number;
  taxas: number;
  logistica: number;
  lucro: number;
  margem: number;
  // opcional (se você usar nome no front)
  nome?: string;
};

export type DreInsight = {
  level: "success" | "warning" | "danger" | "info";
  title: string;
  detail: string;
};

function n(v: unknown): number {
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

export function gerarInsightsDre(dre?: Partial<DreResultado> | null): DreInsight[] {
  if (!dre) return [];

  const receitaTotal = n(dre.receitaTotal);
  const custoProdutos = n(dre.custoProdutos);
  const taxas = n(dre.taxas);
  const logistica = n(dre.logistica);
  const lucro = n(dre.lucro);
  const margem = n(dre.margem);

  const insights: DreInsight[] = [];

  if (receitaTotal <= 0) {
    insights.push({
      level: "warning",
      title: "Receita zerada ou ausente",
      detail:
        "Sua planilha parece não conter valores de receita (ou a coluna não foi reconhecida). Confira se existe uma coluna de Receita.",
    });
    return insights;
  }

  if (lucro < 0) {
    insights.push({
      level: "danger",
      title: "Prejuízo no período",
      detail:
        "Seu lucro ficou negativo. Revise custo do produto, taxas e logística. Um pequeno ajuste pode virar o jogo.",
    });
  } else {
    insights.push({
      level: "success",
      title: "Lucro positivo",
      detail:
        "Você está no verde. Agora o foco é aumentar margem com otimização de custos e logística.",
    });
  }

  if (margem < 10) {
    insights.push({
      level: "warning",
      title: "Margem baixa",
      detail:
        "Margem abaixo de 10%. Considere aumentar preço, reduzir custo/embalagem, revisar comissão e frete.",
    });
  } else if (margem >= 20) {
    insights.push({
      level: "success",
      title: "Margem saudável",
      detail:
        "Margem acima de 20%. Você está com uma operação bem posicionada — preserve o que está funcionando.",
    });
  } else {
    insights.push({
      level: "info",
      title: "Margem moderada",
      detail:
        "Você está numa margem ok. Dá pra melhorar com ajustes finos (logística, custo e taxa).",
    });
  }

  const pesoTaxas = receitaTotal > 0 ? (taxas / receitaTotal) * 100 : 0;
  if (pesoTaxas >= 15) {
    insights.push({
      level: "warning",
      title: "Taxas altas em relação à receita",
      detail:
        `As taxas representam ~${pesoTaxas.toFixed(1)}% da receita. Vale revisar categoria/anúncio, comissões e promoções.`,
    });
  }

  const pesoLog = receitaTotal > 0 ? (logistica / receitaTotal) * 100 : 0;
  if (pesoLog >= 10) {
    insights.push({
      level: "warning",
      title: "Logística está pesando",
      detail:
        `A logística representa ~${pesoLog.toFixed(1)}% da receita. Compare FULL vs FLEX para reduzir impacto.`,
    });
  }

  return insights;
}
