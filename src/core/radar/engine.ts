import { baseCalculator } from "./engine.calculators";
import type { EngineInput, EngineResult } from "./engine.types";

export function runEngine(input: EngineInput): EngineResult {
  const calc = baseCalculator(input);

  const status =
    calc.score >= 75
      ? "excelente"
      : calc.score >= 50
      ? "atenção"
      : "risco";

  const alertas: string[] = [];

  if (calc.margem < 10) {
    alertas.push("Margem apertada para absorver custos invisíveis.");
  }

  if (input.frete / Math.max(1, input.precoVenda) > 0.14) {
    alertas.push("Frete pesado para o ticket atual.");
  }

  if (input.taxaPercent >= 16) {
    alertas.push("Taxa do canal pressionando lucro.");
  }

  if (!alertas.length) {
    alertas.push("Estrutura saudável para escalar.");
  }

  const recomendacaoPreco =
    (input.custoProduto + input.frete) /
    Math.max(
      0.01,
      1 -
        (input.taxaPercent +
          (input.devolucaoPercent ?? 2) +
          (input.adsPercent ?? 6)) /
          100 -
        0.18
    );

  return {
    score: calc.score,
    margem: calc.margem,
    lucro: calc.lucro,
    status,
    insights: [
      `Lucro unitário: R$ ${calc.lucro}`,
      `Margem atual: ${calc.margem}%`,
    ],
    alertas,
    recomendacoes: [
      `Teste preço em R$ ${recomendacaoPreco.toFixed(2)}`,
      "Criar kit para diluir frete",
      "Evitar escalar produto com margem fraca",
    ],
    meta: {
      taxas: calc.taxas,
      devolucao: calc.devolucao,
      ads: calc.ads,
      precoRecomendado: recomendacaoPreco,
    },
  };
}
