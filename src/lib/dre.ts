// src/lib/dre/calcularDRE.ts (ou o caminho que você usa)

export type TipoLinhaDre = "receita" | "custo" | "taxa";

export interface LinhaDre {
  tipo: TipoLinhaDre;
  valor: number;
}

export interface DreBasico {
  receita: number;
  custos: number;
  taxas: number;
  lucro: number;
}

export function calcularDRE(linhas: LinhaDre[]): DreBasico {
  const receita = linhas
    .filter((l) => l.tipo === "receita")
    .reduce((acc, l) => acc + l.valor, 0);

  const custos = linhas
    .filter((l) => l.tipo === "custo")
    .reduce((acc, l) => acc + l.valor, 0);

  const taxas = linhas
    .filter((l) => l.tipo === "taxa")
    .reduce((acc, l) => acc + l.valor, 0);

  const lucro = receita - custos - taxas;

  return { receita, custos, taxas, lucro };
}




