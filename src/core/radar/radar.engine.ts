import { runEngine } from "@/core/engine/engine";

export type RadarProductInput = {
  nome: string;
  custo: number;
  precoSugerido?: number;
  categoria?: string;
};

export type RadarBadge =
  | "oportunidade_real"
  | "avaliar_com_cuidado"
  | "evitar";

export type RadarItem = {
  nome: string;
  categoria?: string;
  custo: number;
  preco: number;
  score: number;
  margem: number;
  lucro: number;
  status: "excelente" | "atenção" | "risco";
  badge: RadarBadge;
  insights: string[];
  alertas: string[];
  recomendacoes: string[];
  meta: Record<string, any>;
};

export type RadarResult = {
  ranking: RadarItem[];
  oportunidades: RadarItem[];
  atentos: RadarItem[];
  risco: RadarItem[];
};

type RadarInput = {
  produtos: RadarProductInput[];
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function estimateSellingPrice(produto: RadarProductInput) {
  if (produto.precoSugerido && produto.precoSugerido > 0) {
    return round2(produto.precoSugerido);
  }

  return round2(produto.custo * 2.2);
}

function estimateFreight(preco: number) {
  return round2(preco * 0.12);
}

function getBadge(score: number): RadarBadge {
  if (score >= 80) return "oportunidade_real";
  if (score >= 60) return "avaliar_com_cuidado";
  return "evitar";
}

function normalizeItem(produto: RadarProductInput): RadarItem {
  const preco = estimateSellingPrice(produto);

  const result = runEngine({
    produto: produto.nome,
    categoria: produto.categoria,
    precoVenda: preco,
    custoProduto: produto.custo,
    frete: estimateFreight(preco),
    taxaPercent: 16,
    devolucaoPercent: 2,
    adsPercent: 6,
  });

  return {
    nome: produto.nome,
    categoria: produto.categoria,
    custo: round2(produto.custo),
    preco,
    score: result.score,
    margem: result.margem,
    lucro: result.lucro,
    status: result.status,
    badge: getBadge(result.score),
    insights: result.insights,
    alertas: result.alertas,
    recomendacoes: result.recomendacoes,
    meta: result.meta,
  };
}

export function runRadar(input: RadarInput): RadarResult {
  const ranking = input.produtos
    .filter((produto) => produto.nome && produto.custo > 0)
    .map(normalizeItem)
    .sort((a, b) => b.score - a.score);

  const oportunidades = ranking.filter((item) => item.score >= 80);
  const atentos = ranking.filter((item) => item.score >= 60 && item.score < 80);
  const risco = ranking.filter((item) => item.score < 60);

  return {
    ranking,
    oportunidades,
    atentos,
    risco,
  };
}