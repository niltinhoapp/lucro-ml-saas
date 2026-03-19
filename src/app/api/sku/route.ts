import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";


export const runtime = "nodejs";

export async function GET() {
  const { data, error } = await supabase
    .from("sku_custos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Erro ao buscar SKUs." }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const body = await req.json();

  const sku = String(body?.sku ?? "").trim();
  if (!sku) return NextResponse.json({ error: "SKU é obrigatório." }, { status: 400 });

  const payload = {
    sku,
    titulo: body?.titulo ?? null,
    custo_unitario: Number(body?.custo_unitario ?? 0),
    embalagem: Number(body?.embalagem ?? 0),
    imposto: Number(body?.imposto ?? 0),
    frete_medio: Number(body?.frete_medio ?? 0),
    ativo: body?.ativo ?? true,
  };

  const { data, error } = await supabase
    .from("sku_custos")
    .upsert(payload, { onConflict: "sku" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Erro ao salvar SKU." }, { status: 500 });
  return NextResponse.json(data);
}
