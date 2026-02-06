import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import { normalizarPlanilha } from "@/lib/normalizarPlanilha";
import { calcularDre } from "@/lib/dre/calcularDre";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[];

    const linhas = normalizarPlanilha(rows);
    const dre = calcularDre(linhas);

    const payload = {
      nome: `Simulação - ${new Date().toLocaleString("pt-BR")}`,
      user_id: null,
      receita_total: dre.receitaTotal,
      custo_produtos: dre.custoProdutos,
      taxas: dre.taxas,
      logistica: dre.logistica,
      lucro: dre.lucro,
      margem: dre.margem,
      origem: "upload",
      arquivo_nome: file.name,
      dados: { linhas }, // jsonb
    };

    const { data, error } = await supabase
      .from("simulacoes")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      dre,
      message: "Upload e DRE calculados com sucesso",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
