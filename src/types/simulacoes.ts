export type SimulacaoRow = {
  id: string;
  nome: string;
  created_at: string;

  receita_total: number;
  custo_produtos: number;
  taxas: number;
  logistica: number;

  lucro: number;
  margem: number;

  origem?: "upload" | "calculadora" | string;
  arquivo_nome?: string | null;
};





