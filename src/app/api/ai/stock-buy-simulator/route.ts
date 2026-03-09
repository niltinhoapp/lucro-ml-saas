import { NextResponse } from "next/server";
import { stockBuySimulator } from "@/lib/market/advanced";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json(stockBuySimulator({
    produto: String(body?.produto ?? "Produto"),
    precoVenda: Number(body?.precoVenda ?? 99),
    custoUnitario: Number(body?.custoUnitario ?? 35),
    freteUnitario: Number(body?.freteUnitario ?? 12),
    taxaPercent: Number(body?.taxaPercent ?? 16),
    quantidade: Number(body?.quantidade ?? 50),
    giroMensal: Number(body?.giroMensal ?? 30),
  }));
}
