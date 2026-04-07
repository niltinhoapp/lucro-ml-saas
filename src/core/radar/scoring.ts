export function calculateScore(item: any) {
  const margem = 20; // placeholder

  return {
    score: margem * 2,
    margem,
    risco: margem > 30 ? "baixo" : "medio",
  };
}
