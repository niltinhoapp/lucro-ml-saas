// src/types/dre.ts

export interface DreResumo {
  nome: string;

  receita_total: number;
  custo_produtos: number;
  taxas: number;
  logistica: number;

  lucro: number;
  margem_percentual: number;
}

export interface DreLinha {
  data: string;
  produto: string;

  receita: number;
  custo: number;
  taxa: number;
  logistica: number;
}

export interface DreSimulacao {
  id: string;
  nome: string;
  criado_em: string;

  resumo: DreResumo;
  linhas: DreLinha[];
}
