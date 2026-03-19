import { NextResponse } from "next/server";
import { hiddenLossDetector } from "@/lib/market/advanced";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json(hiddenLossDetector({
    produto: String(body?.produto ?? "Produto"),
    precoVenda: Number(body?.precoVenda ?? 99),
    custoProduto: Number(body?.custoProduto ?? 35),
    frete: Number(body?.frete ?? 12),
    taxaPercent: Number(body?.taxaPercent ?? 16),
    devolucaoPercent: Number(body?.devolucaoPercent ?? 3),
    adsPercent: Number(body?.adsPercent ?? 6),
  }));
}
