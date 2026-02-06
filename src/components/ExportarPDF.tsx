"use client";

import { gerarPdfDre } from "@/lib/pdf/gerarPdfDre";

export type DreResultadoUi = {
  receitaTotal: number;
  custoProdutos: number;
  taxas: number;
  logistica: number;
  lucro: number;
  margem: number;
};

export default function ExportarPDF({
  nome,
  dre,
}: {
  nome: string;
  dre: DreResultadoUi;
}) {
  return (
    <button
      onClick={() =>
        gerarPdfDre({
          nome,
          receitaTotal: dre.receitaTotal,
          custoProdutos: dre.custoProdutos,
          taxas: dre.taxas,
          logistica: dre.logistica,
          lucro: dre.lucro,
          margem: dre.margem,
        })
      }
      className="btn-primary"
      type="button"
    >
      Exportar PDF
    </button>
  );
}
