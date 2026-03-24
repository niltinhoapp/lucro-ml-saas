export const ML_RADAR_ENABLED = true;

export type RadarItem = {
  produto: string;
  custo: number;
  margem: number;
  oportunidade: number;
  risco: "baixo" | "medio" | "alto";
  recomendacao: string;
};

export type RadarOutput = {
  top: RadarItem[];
  evitar: RadarItem[];
  ajustar: RadarItem[];
  resumo: string[];
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function scoreProduto(
  margem: number,
  demanda: number,
  concorrencia: number
) {
  return clamp(
    Math.round(margem * 2 + demanda - concorrencia * 0.6),
    0,
    100
  );
}

export function generateRadar(
  items: Array<{
    produto: string;
    custo: number;
    margem: number;
    demanda: number;
    concorrencia: number;
  }>
): RadarOutput {
  const enriched: RadarItem[] = items.map((item) => {
    const oportunidade = scoreProduto(
      item.margem,
      item.demanda,
      item.concorrencia
    );

    let risco: RadarItem["risco"] = "medio";

    if (item.margem > 20 && oportunidade > 70) {
      risco = "baixo";
    } else if (item.margem < 10 || oportunidade < 40) {
      risco = "alto";
    }

    let recomendacao = "Validar antes de escalar.";

    if (risco === "baixo") {
      recomendacao = "Testar imediatamente.";
    } else if (risco === "alto") {
      recomendacao = "Evitar entrada neste momento.";
    }

    return {
      produto: item.produto,
      custo: item.custo,
      margem: item.margem,
      oportunidade,
      risco,
      recomendacao,
    };
  });

  const top = enriched
    .filter((item) => item.risco === "baixo")
    .sort((a, b) => b.oportunidade - a.oportunidade)
    .slice(0, 5);

  const evitar = enriched
    .filter((item) => item.risco === "alto")
    .sort((a, b) => a.oportunidade - b.oportunidade)
    .slice(0, 5);

  const ajustar = enriched
    .filter((item) => item.risco === "medio")
    .sort((a, b) => b.oportunidade - a.oportunidade)
    .slice(0, 5);

  return {
    top,
    evitar,
    ajustar,
    resumo: [
      `Top oportunidades: ${top.length}`,
      `Produtos para evitar: ${evitar.length}`,
      `Produtos que precisam ajuste: ${ajustar.length}`,
    ],
  };
}