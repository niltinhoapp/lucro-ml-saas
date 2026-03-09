import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("caixa_relatorios")
      .select("id, nome, arquivo_nome, created_at") // 🔥 leve pro histórico
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[caixa/relatorios] supabase error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (e: any) {
    console.error("[caixa/relatorios] ERROR:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao buscar relatórios de caixa." },
      { status: 500 }
    );
  }
}