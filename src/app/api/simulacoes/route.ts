// src/app/api/simulacoes/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/supabase/server";
import { getEntitlements } from "@/supabase/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeStr(v: any) {
  return typeof v === "string" ? v.trim() : "";
}

function defaultNome({
  nome,
  arquivo_nome,
  idHint,
}: {
  nome?: any;
  arquivo_nome?: any;
  idHint?: string;
}) {
  const n = safeStr(nome);

  if (n && /^simula(ç|c)ão\b/i.test(n)) {
    return n.replace(/^simula(ç|c)ão\b\s*[-–—:]?\s*/i, "Relatório — ");
  }

  if (n) return n;

  const file = safeStr(arquivo_nome);
  if (file) return `Relatório — ${file}`;

  if (idHint) return `Relatório #${idHint.slice(0, 6).toUpperCase()}`;
  return "Relatório DRE";
}

/**
 * GET — listar relatórios do usuário (historico)
 */
export async function GET(req: Request) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
    const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

    const { data, error } = await supabase
      .from("simulacoes")
      .select("id, nome, created_at, receita_total, lucro, margem, arquivo_nome, origem, tipo")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [], limit, offset });
  } catch (err: any) {
    console.error("[api/simulacoes][GET] ERROR:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * POST — salvar novo relatório (com auth + quota trial)
 */
export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();

    // 1) exige login
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 2) entitlements (trial/pro)
    const ent = await getEntitlements(supabase, user.id);

    if (!ent.canUseApp) {
      return NextResponse.json({ error: "trial_expired" }, { status: 402 });
    }

    // 3) quota trial
    if (!ent.isPro) {
      const { count, error: countErr } = await supabase
        .from("simulacoes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (countErr) {
        return NextResponse.json({ error: countErr.message }, { status: 500 });
      }

      if ((count ?? 0) >= ent.maxReports) {
        return NextResponse.json(
          { error: "limit_reached", max: ent.maxReports },
          { status: 403 }
        );
      }
    }

    // 4) payload
    const body = await req.json();

    const receita_total = body.receita_total;
    const custo_produtos = body.custo_produtos;
    const taxas = body.taxas;
    const logistica = body.logistica;
    const lucro = body.lucro;

    // calculadora | planilha (ou use origem)
    const tipo = body.tipo ?? null;

    const arquivo_nome = safeStr(body.arquivo_nome) || null;
    const nomeFinal = defaultNome({ nome: body.nome, arquivo_nome });

    // 5) salva
    const { data, error } = await supabase
      .from("simulacoes")
      .insert([
        {
          user_id: user.id,
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
      .select("id, nome, created_at, receita_total, lucro, margem, arquivo_nome, origem, tipo")
      .single();

    if (error) {
      console.error("[api/simulacoes][POST] supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[api/simulacoes][POST] ERROR:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}