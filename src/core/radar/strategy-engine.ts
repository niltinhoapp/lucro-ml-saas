type StrategyInput = {
  score?: number;
  margem?: number;
  lucroLiquido?: number;
  risco?: string;
};

export function classifyItem(item: StrategyInput): {
  status: "oportunidade" | "revisar" | "evitar";
  motivo: string;
} {
  const score = Number(item.score ?? 0);
  const margem = Number(item.margem ?? 0);
  const lucroLiquido = Number(item.lucroLiquido ?? 0);
  const risco = String(item.risco ?? "alto");

  if (lucroLiquido <= 0) {
    return {
      status: "evitar",
      motivo: "Lucro líquido zerado ou negativo.",
    };
  }

  if (score >= 70 && margem >= 20 && risco === "baixo") {
    return {
      status: "oportunidade",
      motivo: "Boa margem, lucro saudável e risco baixo.",
    };
  }

  if (score >= 40 && margem >= 8) {
    return {
      status: "revisar",
      motivo: "Tem potencial, mas precisa validar concorrência e preço.",
    };
  }

  return {
    status: "evitar",
    motivo: "Margem fraca ou risco elevado.",
  };
}