import { NextResponse } from "next/server";
import { planilhaDiagnostic } from "@/lib/market/advanced";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const rows = Array.isArray(body?.rows) ? body.rows : [];
  return NextResponse.json(planilhaDiagnostic(rows));
}









