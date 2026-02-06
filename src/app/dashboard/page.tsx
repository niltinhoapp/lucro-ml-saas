import { createClient } from "@supabase/supabase-js";
import DashboardHomeClient from "@/components/DashboardHomeClient";
import type { SimulacaoRow } from "@/types/simulacoes";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function DashboardHome() {
  const { data, error } = await supabase
    .from("simulacoes")
    .select(
      "id,nome,created_at,receita_total,custo_produtos,taxas,logistica,lucro,margem,origem,arquivo_nome"
    )
    .order("created_at", { ascending: false })
    .limit(30);

  const simulacoes = ((data ?? []) as SimulacaoRow[]).map((s) => ({
    id: s.id,
    nome: s.nome,
    created_at: s.created_at,
    receitaTotal: Number(s.receita_total ?? 0),
    custoProdutos: Number(s.custo_produtos ?? 0),
    taxas: Number(s.taxas ?? 0),
    logistica: Number(s.logistica ?? 0),
    lucro: Number(s.lucro ?? 0),
    margem: Number(s.margem ?? 0),
    origem: s.origem ?? "upload",
    arquivoNome: s.arquivo_nome ?? null,
  }));

  // Em PROD: trate error com UI; aqui só evita quebrar.
  if (error) console.error("Supabase list error:", error.message);

  return <DashboardHomeClient simulacoes={simulacoes} />;
}
