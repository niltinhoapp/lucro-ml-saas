import GraficoLucro, { type ResultadoComparativo } from "./GraficoLucro";

function buildEmptyResultado(): ResultadoComparativo {
  return {
    full: {
      receita: 0,
      despesas: 0,
      lucro: 0,
      margem: 0,
    },
    flex: {
      receita: 0,
      despesas: 0,
      lucro: 0,
      margem: 0,
    },
    melhor: "FULL",
    diferencaLucro: 0,
  };
}

export default function Page() {
  const resultado = buildEmptyResultado();

  return <GraficoLucro resultado={resultado} destaque="FULL" />;
}