// src/app/dashboard/full-vs-flex/services/simulacao.ts

export type Resultado = {
  receita: number;
  despesas: number;
  lucro: number;
  margem: number;
};

export type ResultadoComparativo = {
  full: Resultado;
  flex: Resultado;
  melhor: "FULL" | "FLEX";
  diferencaLucro: number; // FULL - FLEX
};

export type Simulacao = {
  id: string;
  data: string;
  nome?: string;

  precoVenda: number;
  custoProduto: number;
  taxaML: number;     // em %
  freteMedio: number; // custo de envio (FLEX) por unidade
  custoFull: number;  // custo FULL por unidade
  unidades: number;

  resultado: ResultadoComparativo;
};

function n(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function round2(v: number) {
  return Math.round(v * 100) / 100;
}

function calcReceita(precoVenda: number, unidades: number) {
  return n(precoVenda) * Math.max(0, n(unidades));
}

function calcTaxaML(receita: number, taxaMLPercent: number) {
  return receita * (n(taxaMLPercent) / 100);
}

function calcCanal(params: {
  canal: "FULL" | "FLEX";
  precoVenda: number;
  custoProduto: number;  // unitário
  taxaML: number;        // %
  freteMedio: number;    // unit FLEX unitário
  custoFull: number;     // unit FULL unitário
  unidades: number;
}): Resultado {
  const unidades = Math.max(0, n(params.unidades));
  const receita = calcReceita(params.precoVenda, unidades);

  const custoProdutos = n(params.custoProduto) * unidades;
  const taxa = calcTaxaML(receita, params.taxaML);

  const logistica =
    params.canal === "FLEX"
      ? n(params.freteMedio) * unidades
      : n(params.custoFull) * unidades;

  const despesas = custoProdutos + taxa + logistica;
  const lucro = receita - despesas;
  const margem = receita > 0 ? (lucro / receita) * 100 : 0;

  return {
    receita: round2(receita),
    despesas: round2(despesas),
    lucro: round2(lucro),
    margem: round2(margem),
  };
}

export function calcularComparativo(input: {
  precoVenda: number;
  custoProduto: number;
  taxaML: number;
  freteMedio: number;
  custoFull: number;
  unidades: number;
}): ResultadoComparativo {
  const full = calcCanal({ canal: "FULL", ...input });
  const flex = calcCanal({ canal: "FLEX", ...input });

  const diferencaLucro = round2(full.lucro - flex.lucro);
  const melhor: "FULL" | "FLEX" = diferencaLucro >= 0 ? "FULL" : "FLEX";

  return { full, flex, melhor, diferencaLucro };
}

/**
 * Cria um objeto Simulacao pronto para salvar no histórico/banco.
 * - mantém o mesmo shape que seu HistoricoSimulacoes espera.
 */
export function criarSimulacao(params: {
  nome?: string;
  precoVenda: number;
  custoProduto: number;
  taxaML: number;
  freteMedio: number;
  custoFull: number;
  unidades: number;
  id?: string;
  data?: string;
}): Simulacao {
  const id = params.id ?? crypto.randomUUID();
  const data = params.data ?? new Date().toISOString();

  const resultado = calcularComparativo({
    precoVenda: params.precoVenda,
    custoProduto: params.custoProduto,
    taxaML: params.taxaML,
    freteMedio: params.freteMedio,
    custoFull: params.custoFull,
    unidades: params.unidades,
  });

  const nome =
    params.nome?.trim() ||
    `Simulação ${new Date(data).toLocaleDateString("pt-BR")}`;

  return {
    id,
    data,
    nome,
    precoVenda: n(params.precoVenda),
    custoProduto: n(params.custoProduto),
    taxaML: n(params.taxaML),
    freteMedio: n(params.freteMedio),
    custoFull: n(params.custoFull),
    unidades: Math.max(0, n(params.unidades)),
    resultado,
  };
}