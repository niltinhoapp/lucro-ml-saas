// src/lib/dre/calcularDre.ts

export interface LinhaVenda {
  data: string;
  produto: string;
  receita: number;
  custo: number;
  taxa: number;
  logistica: number;
}

export interface DreResultado {
  receitaTotal: number;
  custoProdutos: number;
  taxas: number;
  logistica: number;
  lucro: number;
  margem: number;
}

export function calcularDre(linhas: LinhaVenda[]): DreResultado {
  const receitaTotal = linhas.reduce(
    (total, l) => total + l.receita,
    0
  );

  const custoProdutos = linhas.reduce(
    (total, l) => total + l.custo,
    0
  );

  const taxas = linhas.reduce(
    (total, l) => total + l.taxa,
    0
  );

  const logistica = linhas.reduce(
    (total, l) => total + l.logistica,
    0
  );
  

  const lucro =
    receitaTotal - custoProdutos - taxas - logistica;

  const margem =
    receitaTotal > 0
      ? Number(((lucro / receitaTotal) * 100).toFixed(2))
      : 0;

  return {
    receitaTotal,
    custoProdutos,
    taxas,
    logistica,
    lucro,
    margem,
  };
}





