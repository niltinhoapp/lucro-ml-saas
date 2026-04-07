import type { EngineInput } from "./engine.types";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function keywordFactor(text: string) {
  const value = text.toLowerCase();

  if (/(kit|combo|bundle)/.test(value)) return 1.08;
  if (/(premium|profissional|4k|turbo)/.test(value)) return 1.12;
  if (/(capa|pelicula|suporte|refil)/.test(value)) return 1.06;

  return 1;
}

export function baseCalculator(input: EngineInput) {
  const devolucao = input.devolucaoPercent ?? 2;
  const ads = input.adsPercent ?? 6;

  const taxas = input.precoVenda * (input.taxaPercent / 100);
  const devolucaoCusto = input.precoVenda * (devolucao / 100);
  const adsCusto = input.precoVenda * (ads / 100);

  const lucro =
    input.precoVenda -
    input.custoProduto -
    input.frete -
    taxas -
    devolucaoCusto -
    adsCusto;

  const margem = input.precoVenda > 0 ? (lucro / input.precoVenda) * 100 : 0;

  const scoreBase =
    margem * 2.6 +
    (12 - (input.frete / Math.max(1, input.precoVenda)) * 100) +
    (18 - input.taxaPercent) +
    (6 - devolucao);

  const score = clamp(
    Math.round(scoreBase * keywordFactor(input.produto) + 45),
    1,
    99
  );

  return {
    lucro: round2(lucro),
    margem: round2(margem),
    score,
    taxas: round2(taxas),
    devolucao: round2(devolucaoCusto),
    ads: round2(adsCusto),
  };
}
