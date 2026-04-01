import { NextResponse } from "next/server";
import { calcProductHealth } from "@/lib/market/advanced";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const result = calcProductHealth({
    produto: String(body?.produto ?? "Produto"),
    categoria: String(body?.categoria ?? ""),
    precoVenda: Number(body?.precoVenda ?? 99),
    custoProduto: Number(body?.custoProduto ?? 35),
    frete: Number(body?.frete ?? 12),
    taxaPercent: Number(body?.taxaPercent ?? 16),
    devolucaoPercent: Number(body?.devolucaoPercent ?? 2),
    adsPercent: Number(body?.adsPercent ?? 5),
  });

  return NextResponse.json(result);
}

