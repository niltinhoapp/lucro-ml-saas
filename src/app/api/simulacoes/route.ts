import { NextResponse } from "next/server";
import { createServerClient } from "@/integrations/supabase/server";
import { getEntitlements } from "@/integrations/supabase/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   helpers
   ========================= */

function isRecord(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

function safeStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function calcMargemPercent(receitaTotal: number, lucro: number): number {
  if (!Number.isFinite(receitaTotal) || receitaTotal <= 0) return 0;
  const m = (lucro / receitaTotal) * 100;
  return Number.isFinite(m) ? Number(m.toFixed(2)) : 0;
}

function defaultNome({
  nome,
  arquivo_nome,
  idHint,
}: {
  nome?: unknown;
  arquivo_nome?: unknown;
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

async function countReports(supabase: any, userId: string) {
  const { count, error } = await supabase
    .from("simulacoes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;
  return count ?? 0;
}

/* =========================
   GET — histórico (array puro)
   ========================= */

export async function GET(req: Request) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 401 });
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(asNum(searchParams.get("limit") ?? 50), 1), 200);
    const offset = Math.max(asNum(searchParams.get("offset") ?? 0), 0);

    const { data, error } = await supabase
      .from("simulacoes")
      .select("id, nome, created_at, arquivo_nome, lucro, margem")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[api/simulacoes][GET] supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (err: unknown) {
    console.error("[api/simulacoes][GET] ERROR:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/* =========================
   POST — criar relatório (Plano B)
   - Free: permite criar até maxReports
   - Depois disso: NÃO cria mais (403)
   - Importante: não bloqueia uso do app por trial expirar aqui
   ========================= */

type Payload = {
  receita_total?: unknown;
  custo_produtos?: unknown;
  taxas?: unknown;
  logistica?: unknown;

  lucro?: unknown;
  margem?: unknown;

  tipo?: unknown;
  arquivo_nome?: unknown;
  nome?: unknown;

  dados?: unknown; // jsonb opcional
};

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 401 });
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const ent = await getEntitlements(supabase, user.id);

    // ✅ PLANO B:
    // NÃO bloqueia aqui por trial expirar.
    // O bloqueio acontece nas SAÍDAS: blur, export, IA, etc.
    // (Então removemos o 402.)

    // ✅ limite no free
    const existingCount = await countReports(supabase, user.id);

    if (!ent.isPro && existingCount >= ent.maxReports) {
      return NextResponse.json(
        {
          error: "limit_reached",
          max: ent.maxReports,
          count: existingCount,
          locked: true,
        },
        { status: 403 }
      );
    }

    const raw: unknown = await req.json().catch(() => ({}));
    if (!isRecord(raw)) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const p = raw as Payload;

    const receita_total = Math.max(0, asNum(p.receita_total));
    const custo_produtos = Math.max(0, asNum(p.custo_produtos));
    const taxas = Math.max(0, asNum(p.taxas));
    const logistica = Math.max(0, asNum(p.logistica));

    if (receita_total <= 0) {
      return NextResponse.json({ error: "receita_total_invalid" }, { status: 400 });
    }

    const lucro_calc = receita_total - custo_produtos - taxas - logistica;
    const lucro_in = "lucro" in p ? asNum(p.lucro) : NaN;
    const lucro = Number((Number.isFinite(lucro_in) ? lucro_in : lucro_calc).toFixed(2));

    const margem_in = "margem" in p ? asNum(p.margem) : NaN;
    const margem = Number(
      (Number.isFinite(margem_in) ? margem_in : calcMargemPercent(receita_total, lucro)).toFixed(2)
    );

    const tipo = safeStr(p.tipo) || null;
    const arquivo_nome = safeStr(p.arquivo_nome) || null;
    const nomeFinal = defaultNome({ nome: p.nome, arquivo_nome });

    const dados: Record<string, unknown> | null =
      isRecord(p.dados) ? (p.dados as Record<string, unknown>) : null;

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
          margem,
          tipo,
          dados,
        },
      ])
      .select("id, nome, created_at, receita_total, lucro, margem, arquivo_nome, origem, tipo")
      .single();

    if (error) {
      console.error("[api/simulacoes][POST] supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const newCount = existingCount + 1;
    const remaining = ent.isPro ? 999999 : Math.max(ent.maxReports - newCount, 0);

    return NextResponse.json({
      ...data,
      entitlements: {
        isPro: ent.isPro,
        maxReports: ent.maxReports,
        count: newCount,
        remainingReports: remaining,
      },
    });
  } catch (err: unknown) {
    console.error("[api/simulacoes][POST] ERROR:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

