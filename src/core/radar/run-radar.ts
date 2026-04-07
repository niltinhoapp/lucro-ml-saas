import { fetchMl } from "./ml-client";
import { calculateScore } from "./scoring";
import { classifyItem } from "./strategy-engine";

export type RadarProductInput = {
  nome: string;
  custo: number;
  categoria?: string;
  precoSugerido?: number;
};

export type RadarQueryInput = {
  query: string;
};

export type RadarProdutosInput = {
  produtos: RadarProductInput[];
};

export type RadarInput = RadarQueryInput | RadarProdutosInput;

export type RadarRankingItem = RadarProductInput & {
  score: number;
  margem: number;
  risco: string;
  status: "oportunidade" | "revisar" | "evitar";
};

export type RadarResult = {
  ranking: RadarRankingItem[];
  total: number;
};

function isQueryInput(input: RadarInput): input is RadarQueryInput {
  return "query" in input;
}

function isProdutosInput(input: RadarInput): input is RadarProdutosInput {
  return "produtos" in input;
}

export async function runRadar(input: RadarInput): Promise<RadarResult> {
  let items: RadarProductInput[] = [];

  if (isQueryInput(input)) {
    const mlItems = await fetchMl(input.query);

    items = (mlItems || []).map((item: any) => ({
      nome: String(item.title ?? ""),
      custo: Number(item.price ?? 0),
      categoria: String(item.category_id ?? ""),
      precoSugerido:
        item.price != null ? Number(item.price) : undefined,
    }));
  }

  if (isProdutosInput(input)) {
    items = input.produtos;
  }

  const ranking: RadarRankingItem[] = items.map((item) => {
    const scoreData = calculateScore(item);
    const strategyData = classifyItem({
      ...item,
      ...scoreData,
    });

    return {
      ...item,
      score: Number(scoreData.score ?? 0),
      margem: Number(scoreData.margem ?? 0),
      risco: String(scoreData.risco ?? "medio"),
      status: strategyData.status,
    };
  });

  return {
    ranking,
    total: ranking.length,
  };
}