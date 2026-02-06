import { LinhaVenda, LinhaPlanilha } from "@/types/vendas";

/**
 * Converte strings monetárias e números para number.
 * Ex.: "R$ 1.234,56" → 1234.56
 */
function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    return Number(
      value
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim()
    ) || 0;
  }
  return 0;
}

/**
 * Normaliza a planilha importada em um array de LinhaVenda
 */
export function normalizarPlanilha(rows: LinhaPlanilha[]): LinhaVenda[] {
  return rows.map((row) => ({
    data: String(row["Data"] ?? ""),
    produto: String(row["Produto"] ?? ""),
    receita: toNumber(row["Receita"]),
    custo: toNumber(row["Custo"]),
    taxa: toNumber(row["Taxa ML"]),
    logistica: toNumber(row["Logística"]),
  }));
}
