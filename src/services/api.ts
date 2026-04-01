import { Receita, Despesa } from "../types";

export const getReceitas = (): Receita[] => [
  { id: 1, descricao: "Venda ML", valor: 5000, data: "2026-02-01" },
  { id: 2, descricao: "Venda ML Full", valor: 8000, data: "2026-02-02" },
];

export const getDespesas = (): Despesa[] => [
  { id: 1, descricao: "Frete", valor: 500, data: "2026-02-01" },
  { id: 2, descricao: "Taxa ML", valor: 800, data: "2026-02-02" },
];



