import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * POST — salvar nova simulação
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      nome,
      receita_total,
      custo_produtos,
      taxas,
      logistica,
      lucro,
      tipo, // calculadora | planilha
    } = body;

    const { data, error } = await supabase
      .from("simulacoes")
      .insert([
        {
          nome,
          receita_total,
          custo_produtos,
          taxas,
          logistica,
          lucro,
          tipo,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Erro Supabase:", error);
      return NextResponse.json(
        { error: "Erro ao salvar simulação" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Erro API:", err);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}

/**
 * GET — listar histórico de simulações
 */
export async function GET() {
  const { data, error } = await supabase
    .from("simulacoes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Erro ao buscar simulações" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
