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
    <div className="dash2-hist">
      <div className="dash2-hist-head">
        <div className="dash2-hist-copy">
          <h3 className="dash2-h3">Histórico</h3>
        </div>

        <span className="dash2-count">{simulacoes.length}</span>
      </div>

      {simulacoes.length === 0 ? (
        <div className="dash2-empty">
          <div className="dash2-empty-title">Nenhuma simulação</div>
          <div className="dash2-empty-sub">
            Importe uma planilha para começar.
          </div>
        </div>
      ) : (
        <div className="dash2-hist-list">
          {simulacoes.map((sim) => (
            <div key={sim.id} className="dash2-hist-row">
              <div className="dash2-hist-left">
                <div className="dash2-hist-title" title={sim.nome}>
                  {sim.nome}
                </div>

                <div className="dash2-hist-meta">
                  {new Date(sim.created_at).toLocaleString("pt-BR")}
                  {sim.arquivo_nome ? ` • ${sim.arquivo_nome}` : ""}
                </div>
              </div>

              <div className="dash2-hist-actions">
                <Link href={`/dashboard/dre?id=${sim.id}`} className="btn btn-ghost">
                  Abrir
                </Link>

                <button
                  type="button"
                  className="btn btn-primary"
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
                >
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




