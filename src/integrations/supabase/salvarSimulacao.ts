export interface DrePersistencia {
  nome: string;
  receitaTotal: number;
  custoProdutos: number;
  taxas: number;
  logistica: number;
  lucro: number;
  margem: number;
  arquivoNome?: string | null;
  origem?: string | null;
  dados?: Record<string, unknown> | null;
}

export async function salvarSimulacao(dre: DrePersistencia) {
  const res = await fetch("/api/simulacoes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nome: dre.nome,
      receita_total: dre.receitaTotal,
      custo_produtos: dre.custoProdutos,
      taxas: dre.taxas,
      logistica: dre.logistica,
      lucro: dre.lucro,
      margem: dre.margem,
      arquivo_nome: dre.arquivoNome ?? null,
      origem: dre.origem ?? "calculadora",
      dados: dre.dados ?? null,
    }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    console.error("Erro ao salvar simulação:", json);
    throw new Error(json?.error || "Falha ao salvar simulação");
  }

  return json;
}



