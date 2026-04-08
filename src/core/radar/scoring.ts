type ScoringInput = {
  custo?: number;
  precoSugerido?: number;
};

export type RadarScoreResult = {
  precoVenda: number;
  custoProduto: number;
  taxaPercentual: number;
  taxaValor: number;
  freteEstimado: number;
  lucroLiquido: number;
  margem: number;
  score: number;
  risco: "baixo" | "medio" | "alto";
};

function estimateMarketplaceFee(precoVenda: number) {
  if (precoVenda <= 0) return 0;

  // base simples e realista para MVP
  // pode ajustar depois por categoria/plano/tipo de anúncio
  return precoVenda * 0.16;
}

function estimateShipping(precoVenda: number) {
  if (precoVenda <= 0) return 0;

  if (precoVenda < 30) return 6;
  if (precoVenda < 80) return 12;
  if (precoVenda < 150) return 18;
  return 25;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function calculateScore(item: ScoringInput): RadarScoreResult {
  const custoProduto = Number(item.custo ?? 0);
  const precoVenda = Number(item.precoSugerido ?? 0);

  if (precoVenda <= 0 || custoProduto <= 0) {
    return {
      precoVenda,
      custoProduto,
      taxaPercentual: 16,
      taxaValor: 0,
      freteEstimado: 0,
      lucroLiquido: 0,
      margem: 0,
      score: 0,
      risco: "alto",
    };
  }

  const taxaValor = estimateMarketplaceFee(precoVenda);
  const freteEstimado = estimateShipping(precoVenda);
  const lucroLiquido = precoVenda - custoProduto - taxaValor - freteEstimado;
  const margem = precoVenda > 0 ? (lucroLiquido / precoVenda) * 100 : 0;

  let scoreBase = 0;

  // margem pesa mais
  scoreBase += margem * 2.2;

  // lucro absoluto ajuda
  scoreBase += lucroLiquido * 0.35;

  // punições
  if (lucroLiquido <= 0) scoreBase -= 35;
  if (margem < 8) scoreBase -= 20;
  if (margem >= 20) scoreBase += 10;
  if (margem >= 30) scoreBase += 10;

  const score = Math.round(clamp(scoreBase, 0, 100));

  let risco: "baixo" | "medio" | "alto" = "alto";
  if (margem >= 25 && lucroLiquido >= 20) risco = "baixo";
  else if (margem >= 10 && lucroLiquido > 0) risco = "medio";

  return {
    precoVenda: Number(precoVenda.toFixed(2)),
    custoProduto: Number(custoProduto.toFixed(2)),
    taxaPercentual: 16,
    taxaValor: Number(taxaValor.toFixed(2)),
    freteEstimado: Number(freteEstimado.toFixed(2)),
    lucroLiquido: Number(lucroLiquido.toFixed(2)),
    margem: Number(margem.toFixed(2)),
    score,
    risco,
  };
}