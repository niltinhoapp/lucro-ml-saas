import { fetchMl } from "./ml-client";
import { calculateScore } from "./scoring";
import { classifyItem } from "./strategy-engine";

export type RadarProductInput = {
  nome: string;
  custo: number;
  categoria?: string;
  precoSugerido?: number;
};

export type RadarInput =
  | string
  | { query: string }
  | { produtos: RadarProductInput[] };

export type RadarRankingItem = RadarProductInput & {
  precoVenda: number;
  custoProduto: number;
  taxaPercentual: number;
  taxaValor: number;
  freteEstimado: number;
  lucroLiquido: number;
  margem: number;
  score: number;
  risco: string;
  status: "oportunidade" | "revisar" | "evitar";
  motivo: string;
};

export type RadarResult = {
  ranking: RadarRankingItem[];
  total: number;
  resumo: {
    oportunidades: number;
    revisar: number;
    evitar: number;
  };
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function runRadar(input: RadarInput): Promise<RadarResult> {
  let items: RadarProductInput[] = [];

  if (typeof input === "string") {
    const mlItems = await fetchMl(input);

    items = (mlItems ?? []).map((item: any) => ({
      nome: String(item.title ?? ""),
      custo: Number(item.price ?? 0) * 0.55,
      categoria: String(item.category_id ?? ""),
      precoSugerido: item.price != null ? Number(item.price) : undefined,
    }));
  } else if (isPlainObject(input) && "query" in input) {
    const query = typeof input.query === "string" ? input.query : "";
    const mlItems = await fetchMl(query);

    items = (mlItems ?? []).map((item: any) => ({
      nome: String(item.title ?? ""),
      custo: Number(item.price ?? 0) * 0.55,
      categoria: String(item.category_id ?? ""),
      precoSugerido: item.price != null ? Number(item.price) : undefined,
    }));
  } else if (isPlainObject(input) && "produtos" in input) {
    items = Array.isArray(input.produtos) ? input.produtos : [];
  }

  const ranking: RadarRankingItem[] = items.map((item) => {
    const scoreData = calculateScore(item);
    const strategyData = classifyItem(scoreData);

    return {
      ...item,
      ...scoreData,
      ...strategyData,
    };
  });

  ranking.sort((a, b) => b.score - a.score);

  return {
    ranking,
    total: ranking.length,
    resumo: {
      oportunidades: ranking.filter((item) => item.status === "oportunidade").length,
      revisar: ranking.filter((item) => item.status === "revisar").length,
      evitar: ranking.filter((item) => item.status === "evitar").length,
    },
  };
}