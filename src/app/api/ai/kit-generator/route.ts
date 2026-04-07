import { NextResponse } from "next/server";
import { generateKitIdeas } from "@/lib/market/advanced";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const produto = String(body?.produto ?? "");
  const categoria = String(body?.categoria ?? "geral");
  const precoBase = Number(body?.precoBase ?? 79.9);

  return NextResponse.json(generateKitIdeas(produto, categoria, precoBase));
}









