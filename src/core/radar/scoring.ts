type ScoringInput = {
  custo?: number;
  precoSugerido?: number;
};

export function calculateScore(item: ScoringInput) {
  const custo = Number(item.custo ?? 0);
  const preco = Number(item.precoSugerido ?? 0);

  const margem = preco > 0 && custo > 0 ? ((preco - custo) / preco) * 100 : 0;
  const score = Math.max(0, Math.round(margem * 2));

  return {
    score,
    margem: Number(margem.toFixed(2)),
    risco: margem >= 25 ? "baixo" : margem >= 10 ? "medio" : "alto",
  };
}