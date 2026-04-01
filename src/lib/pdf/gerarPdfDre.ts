import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type PdfDrePayload = {
  nome: string;
  receitaTotal: number;
  custoProdutos: number;
  taxas: number;
  logistica: number;
  lucro: number;
  margem: number;
};

// tipagem segura (sem any) para o plugin autoTable
type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

function moeda(v: number) {
  const n = Number.isFinite(v) ? v : 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function gerarPdfDre(dre: PdfDrePayload) {
  const doc = new jsPDF() as JsPdfWithAutoTable;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Lucro ML — Relatório DRE", 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(dre.nome || "Simulação", 14, 26);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 32);

  autoTable(doc, {
    startY: 40,
    head: [["Item", "Valor"]],
    body: [
      ["Receita total", moeda(dre.receitaTotal)],
      ["Custo de produtos", moeda(dre.custoProdutos)],
      ["Taxas", moeda(dre.taxas)],
      ["Logística", moeda(dre.logistica)],
      ["Lucro", moeda(dre.lucro)],
      ["Margem", `${Number(dre.margem || 0).toFixed(2)}%`],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [15, 23, 42] },
  });

  const finalY = doc.lastAutoTable?.finalY ?? 40;

  doc.setFontSize(9);
  doc.text(
    "Dica PRO: compare cenários (Full vs Flex) para otimizar margem e caixa.",
    14,
    finalY + 12
  );

  doc.save(`dre-lucro-ml-${Date.now()}.pdf`);
}

