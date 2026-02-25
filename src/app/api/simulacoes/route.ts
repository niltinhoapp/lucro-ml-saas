import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

function safeStr(v: any) {
  return typeof v === "string" ? v.trim() : "";
}

function defaultNome({ nome, arquivo_nome, idHint }: { nome?: any; arquivo_nome?: any; idHint?: string }) {
  const n = safeStr(nome);

  // Se alguém mandou "Simulação ..." troca por "Relatório ..."
  if (n && /^simula(ç|c)ão\b/i.test(n)) {
    return n.replace(/^simula(ç|c)ão\b\s*[-–—:]?\s*/i, "Relatório — ");
  }

  // Se tiver nome e não for “Simulação…”, usa
  if (n) return n;

  const file = safeStr(arquivo_nome);
  if (file) return `Relatório — ${file}`;

  // fallback
  if (idHint) return `Relatório #${idHint.slice(0, 6).toUpperCase()}`;
  return "Relatório DRE";
}

/**
 * POST — salvar novo relatório
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const receita_total = body.receita_total;
    const custo_produtos = body.custo_produtos;
    const taxas = body.taxas;
    const logistica = body.logistica;
    const lucro = body.lucro;
    const tipo = body.tipo; // calculadora | planilha

    const arquivo_nome = safeStr(body.arquivo_nome) || null;
    const nomeFinal = defaultNome({ nome: body.nome, arquivo_nome });

    const { data, error } = await supabase
      .from("simulacoes")
      .insert([
        {
          nome: nomeFinal,
          arquivo_nome,
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
      return NextResponse.json({ error: "Erro ao salvar relatório" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Erro API:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
