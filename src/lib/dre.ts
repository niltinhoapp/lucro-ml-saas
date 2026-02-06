export function calcularDRE(linhas: any[]) {
  const receita = linhas
    .filter(l => l.tipo === "receita")
    .reduce((a, b) => a + b.valor, 0);

  const custos = linhas
    .filter(l => l.tipo === "custo")
    .reduce((a, b) => a + b.valor, 0);

  const taxas = linhas
    .filter(l => l.tipo === "taxa")
    .reduce((a, b) => a + b.valor, 0);

  const lucro = receita - custos - taxas;

  return {
    receita,
    custos,
    taxas,
    lucro,
  };
}
