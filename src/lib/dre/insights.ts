// src/lib/dre/insights.ts

export type DreResultado = {
  receitaTotal: number;
  custoProdutos: number;
  taxas: number;
  logistica: number;
  lucro: number;
  margem: number;
  nome?: string;
};

export type InsightTag =
  | "DADOS"
  | "LUCRO"
  | "MARGEM"
  | "CUSTO"
  | "TAXA"
  | "LOGISTICA"
  | "PRECO"
  | "ACAO";

export type DreInsight = {
  level: "success" | "warning" | "danger" | "info";
  title: string;
  detail: string;
  action_tag: InsightTag;
  priority: 1 | 2 | 3; // 1 = mais importante
};

function n(v: unknown): number {
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

function pct(part: number, total: number) {
  if (total <= 0) return 0;
  return (part / total) * 100;
}

function push(
  arr: DreInsight[],
  item: Omit<DreInsight, "priority"> & { priority?: DreInsight["priority"] }
) {
  arr.push({ ...item, priority: item.priority ?? 2 });
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

  // 1) sanity
  if (receitaTotal <= 0) {
    push(insights, {
      level: "warning",
      title: "Receita zerada ou ausente",
      detail:
        "Não encontrei receita na planilha (ou a coluna não foi reconhecida). Confira se há coluna de Receita/Faturamento e valores numéricos.",
      action_tag: "DADOS",
      priority: 1,
    });
    return insights;
  }

  // 2) status geral (lucro)
  if (lucro < 0) {
    push(insights, {
      level: "danger",
      title: "Prejuízo no período",
      detail:
        "Seu lucro ficou negativo. Priorize: ajustar preço/margem, reduzir custo e atacar logística/taxas.",
      action_tag: "LUCRO",
      priority: 1,
    });
  } else {
    push(insights, {
      level: "success",
      title: "Lucro positivo",
      detail:
        "Você está no verde. Agora o foco é subir margem sem perder conversão (custo, logística e taxa).",
      action_tag: "LUCRO",
      priority: 3,
    });
  }

  // 3) margem
  if (margem < 8) {
    push(insights, {
      level: "danger",
      title: "Margem crítica",
      detail:
        "Margem abaixo de 8%. Qualquer devolução/cupom derruba o resultado. Ajuste preço e custo antes de escalar volume.",
      action_tag: "MARGEM",
      priority: 1,
    });
  } else if (margem < 15) {
    push(insights, {
      level: "warning",
      title: "Margem baixa",
      detail:
        "Margem entre 8% e 15%. Melhore com ajuste fino: negociar custo, rever embalagem/peso e reduzir custo de envio.",
      action_tag: "MARGEM",
      priority: 2,
    });
  } else if (margem >= 25) {
    push(insights, {
      level: "success",
      title: "Margem excelente",
      detail:
        "Margem acima de 25%. Boa folga para investir em ads e promoções controladas sem cair no prejuízo.",
      action_tag: "MARGEM",
      priority: 3,
    });
  } else {
    push(insights, {
      level: "info",
      title: "Margem saudável",
      detail:
        "Margem entre 15% e 25%. Busque ganhos incrementais (logística/taxa) para subir mais.",
      action_tag: "MARGEM",
      priority: 3,
    });
  }

  // 4) participação na receita
  const pCusto = pct(custoProdutos, receitaTotal);
  const pTaxas = pct(taxas, receitaTotal);
  const pLog = pct(logistica, receitaTotal);

  // 5) maior impacto
  const max = Math.max(custoProdutos, taxas, logistica);
  const top =
    max === custoProdutos
      ? { name: "Custo do produto", p: pCusto, tag: "CUSTO" as const, hint: "Negociar fornecedor, kit/combos e reduzir perdas." }
      : max === taxas
      ? { name: "Taxas ML", p: pTaxas, tag: "TAXA" as const, hint: "Revisar categoria, comissões, promoções e parcelamento." }
      : { name: "Logística", p: pLog, tag: "LOGISTICA" as const, hint: "Comparar FULL vs FLEX, reduzir peso/volume e otimizar envio." };

  push(insights, {
    level: "info",
    title: "Maior impacto no resultado",
    detail: `${top.name} representa ~${top.p.toFixed(1)}% da receita. Próximo passo: ${top.hint}`,
    action_tag: top.tag,
    priority: 2,
  });

  // 6) alertas específicos
  if (pTaxas >= 14) {
    push(insights, {
      level: "warning",
      title: "Taxas altas",
      detail: `Taxas ~${pTaxas.toFixed(1)}% da receita. Valide promoções/cupom e revise comissão/parcelamento.`,
      action_tag: "TAXA",
      priority: 2,
    });
  }

  if (pLog >= 9) {
    push(insights, {
      level: "warning",
      title: "Logística está pesando",
      detail: `Logística ~${pLog.toFixed(1)}% da receita. Atacar peso/medidas e comparar FULL vs FLEX costuma gerar ganho rápido.`,
      action_tag: "LOGISTICA",
      priority: 2,
    });
  }

  if (pCusto >= 70) {
    push(insights, {
      level: "warning",
      title: "Custo do produto muito alto",
      detail: `Custo do produto ~${pCusto.toFixed(1)}% da receita. Negocie custo ou ajuste preço/alvo de margem.`,
      action_tag: "CUSTO",
      priority: 2,
    });
  }

  // Ordena: prioridade (1 primeiro), depois level (danger/warning antes), depois título
  const levelRank: Record<DreInsight["level"], number> = {
    danger: 1,
    warning: 2,
    info: 3,
    success: 4,
  };

  return insights.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const la = levelRank[a.level] ?? 9;
    const lb = levelRank[b.level] ?? 9;
    if (la !== lb) return la - lb;
    return a.title.localeCompare(b.title, "pt-BR");
  });
}




