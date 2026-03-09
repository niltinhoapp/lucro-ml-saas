import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface DrePersistencia {
  nome: string;
  receitaTotal: number;
  custoProdutos: number;
  taxas: number;
  logistica: number;
  lucro: number;
  margem: number;
}

export async function salvarSimulacao(dre: DrePersistencia) {
  const { error } = await supabase.from("simulacoes").insert([
    {
      nome: dre.nome,
      receita_total: dre.receitaTotal,
      custo_produtos: dre.custoProdutos,
      taxas: dre.taxas,
      logistica: dre.logistica,
      lucro: dre.lucro,
      margem: dre.margem,
    },
  ]);

  if (error) {
    console.error("Erro ao salvar simulação:", error);
    throw new Error("Falha ao salvar simulação");
  }
}
