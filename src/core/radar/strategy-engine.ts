type StrategyInput = {
  score?: number;
};

export function classifyItem(item: StrategyInput): {
  status: "oportunidade" | "revisar" | "evitar";
} {
  const score = Number(item.score ?? 0);

  if (score >= 50) {
    return { status: "oportunidade" };
  }

  if (score >= 20) {
    return { status: "revisar" };
  }

  return { status: "evitar" };
}