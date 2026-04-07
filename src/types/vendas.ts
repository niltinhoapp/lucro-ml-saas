// Linha já normalizada (padrão interno do SaaS)
export interface LinhaVenda {
  data: string;
  produto: string;
  receita: number;
  custo: number;
  taxa: number;
  logistica: number;
}

// Linha crua vinda da planilha (CSV / XLSX)
// Mantemos flexível, mas SEM any
export type LinhaPlanilha = Record<string, string | number | null | undefined>;





