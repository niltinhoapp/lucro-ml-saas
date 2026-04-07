export interface LinhaVenda {
  data: string;
  produto: string;
  receita: number;
  custo: number;
  taxa: number;
  logistica: number;
}

export function normalizarPlanilha(rows: any[]): LinhaVenda[] {
  return rows.map((row) => ({
    data: row["Data"] || "",
    produto: row["Produto"] || "",
    receita: Number(row["Receita"] || 0),
    custo: Number(row["Custo"] || 0),
    taxa: Number(row["Taxa ML"] || 0),
    logistica: Number(row["Logística"] || 0),
  }));
}





