"use client";

import Link from "next/link";
import { gerarPdfDre } from "@/lib/pdf/gerarPdfDre";

export type Simulacao = {
  id: string;
  nome: string;

  receita_total: number;
  custo_produtos: number;
  taxas: number;
  logistica: number;

  lucro: number;
  margem: number;

  created_at: string;

  origem?: "upload" | "calculadora";
  arquivo_nome?: string | null;
};

type Props = {
  simulacoes: Simulacao[];
};

export default function HistoricoSimulacoes({ simulacoes }: Props) {
  return (
    <div className="bg-white rounded-xl shadow">
      <div className="p-5 border-b flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Histórico de Simulações (PRO)</h3>
          <p className="text-sm text-gray-500">
            Reabra uma simulação ou exporte PDF em 1 clique.
          </p>
        </div>

        <span className="text-xs text-gray-500">
          {simulacoes.length} registro(s)
        </span>
      </div>

      <div className="divide-y">
        {simulacoes.map((sim) => (
          <div
            key={sim.id}
            className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">{sim.nome}</p>
              <p className="text-sm text-gray-500">
                {new Date(sim.created_at).toLocaleString("pt-BR")}
                {sim.arquivo_nome ? ` • ${sim.arquivo_nome}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/dashboard/dre?id=${sim.id}`}
                className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50"
              >
                Ver DRE
              </Link>

              <button
                type="button"
                onClick={() =>
                  gerarPdfDre({
                    nome: sim.nome,
                    receitaTotal: sim.receita_total,
                    custoProdutos: sim.custo_produtos,
                    taxas: sim.taxas,
                    logistica: sim.logistica,
                    lucro: sim.lucro,
                    margem: sim.margem,
                  })
                }
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Exportar PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
