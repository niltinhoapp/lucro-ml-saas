import { NextResponse } from "next/server";
import crypto from "crypto";

import { createServerClient } from "@/integrations/supabase/server";
import { getEntitlements } from "@/integrations/supabase/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Dre = {
  receitaTotal: number;
  custoProdutos: number;
  taxas: number;
  logistica: number;
  lucro: number;
  margem: number;
};

type Body = {
  workspace_id?: string; // opcional
  dre?: Dre;
};

type InsightResult = {
  key: string;
  resumo: string;
  pontos: string[];
  recomendacao: string;
};

function sha(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

function asNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isDre(x: unknown): x is Dre {
  if (!isRecord(x)) return false;
  return (
    typeof x.receitaTotal === "number" &&
    typeof x.custoProdutos === "number" &&
    typeof x.taxas === "number" &&
    typeof x.logistica === "number" &&
    typeof x.lucro === "number" &&
    typeof x.margem === "number"
  );
}

async function tableExistsError(e: unknown) {
  // Postgrest error comum quando tabela não existe: "42P01"
  const msg = e instanceof Error ? e.message : "";
  return msg.includes("42P01") || msg.toLowerCase().includes("does not exist");
}

async function getAiUsageCount(supabase: any, userId: string): Promise<number> {
  // tabela opcional: ai_usage (se não existir, retorna 0 sem quebrar)
  try {
    const { data, error } = await supabase
      .from("ai_usage")
      .select("dre_insights_count")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      if (await tableExistsError(error)) return 0;
      throw error;
    }

    const c = asNum(data?.dre_insights_count);
    return c < 0 ? 0 : c;
  } catch (e) {
    if (await tableExistsError(e)) return 0;
    throw e;
  }
}

async function incAiUsageCount(supabase: any, userId: string, nextCount: number) {
  try {
    const { error } = await supabase
      .from("ai_usage")
      .upsert({ user_id: userId, dre_insights_count: nextCount }, { onConflict: "user_id" });

    if (error) {
      if (await tableExistsError(error)) return; // ignora se tabela não existir
      throw error;
    }
  } catch (e) {
    if (await tableExistsError(e)) return;
    throw e;
  }
}

async function readCache(supabase: any, key: string): Promise<InsightResult | null> {
  // tabela opcional: ai_cache (se não existir, ignora)
  try {
    const { data, error } = await supabase
      .from("ai_cache")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      if (await tableExistsError(error)) return null;
      throw error;
    }

    const v = data?.value;
    if (v && typeof v === "object") return v as InsightResult;
    return null;
  } catch (e) {
    if (await tableExistsError(e)) return null;
    throw e;
  }
}

async function writeCache(supabase: any, key: string, workspace_id: string, value: InsightResult) {
  try {
    const { error } = await supabase
      .from("ai_cache")
      .upsert({ key, workspace_id, value }, { onConflict: "key" });

    if (error) {
      if (await tableExistsError(error)) return;
      throw error;
    }
  } catch (e) {
    if (await tableExistsError(e)) return;
    throw e;
  }
}

function buildResult(key: string, dre: Dre): InsightResult {
  const taxaPct = dre.receitaTotal > 0 ? dre.taxas / dre.receitaTotal : 0;

  const pontos: string[] = [
    dre.margem >= 15
      ? "Margem saudável (≥ 15%)."
      : dre.margem >= 8
      ? "Margem apertada: dá pra melhorar com preço ou redução de custos."
      : "Margem muito baixa: alto risco de prejuízo.",
    dre.lucro >= 0
      ? "Operação lucrativa no cenário atual."
      : "Prejuízo no cenário atual: ajuste preço, custos, taxas ou logística.",
    taxaPct >= 0.18
      ? "Taxas estão pesadas vs receita (≥ 18%). Revise categoria/anúncio e repasse no preço."
      : "Taxas dentro de uma faixa comum.",
  ];

  const recomendacao =
    dre.margem < 8
      ? "Priorize: aumentar preço mínimo + reduzir logística + revisar taxas."
      : "Otimize: testar aumento pequeno de preço e reduzir custos/logística para subir margem.";

  return {
    key,
    resumo: "Leitura automática do seu DRE (beta).",
    pontos,
    recomendacao,
  };
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr) return NextResponse.json({ ok: false, error: authErr.message }, { status: 401 });
    if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

    const ent = await getEntitlements(supabase, user.id);

    const raw: unknown = await req.json().catch(() => ({}));
    if (!isRecord(raw)) {
      return NextResponse.json({ ok: false, error: "payload inválido" }, { status: 400 });
    }

    const body = raw as Body;

    const workspace_id = body.workspace_id?.trim() || "default";

    if (!isDre(body.dre)) {
      return NextResponse.json({ ok: false, error: "dre ausente ou inválido" }, { status: 400 });
    }

    const dre = body.dre;

    // ✅ chave (pra cache)
    const key = sha(`${workspace_id}:${JSON.stringify(dre)}`);

    // ✅ Plano B:
    // - PRO: ilimitado
    // - FREE: 1 uso de IA (beta) e depois bloqueia (manda CTA)
    const FREE_LIMIT = 1;

    if (!ent.isPro) {
      const used = await getAiUsageCount(supabase, user.id);
      if (used >= FREE_LIMIT) {
        return NextResponse.json(
          {
            ok: false,
            error: "ai_limit_reached",
            message: "Você já usou seu insight grátis. Assine o PRO para liberar IA ilimitada.",
            entitlements: { isPro: false, aiFreeLimit: FREE_LIMIT, aiUsed: used },
          },
          { status: 402 }
        );
      }
    }

    // ✅ tenta cache
    const cached = await readCache(supabase, key);
    if (cached) {
      // conta uso no FREE mesmo vindo do cache (pra não burlar)
      if (!ent.isPro) {
        const used = await getAiUsageCount(supabase, user.id);
        await incAiUsageCount(supabase, user.id, used + 1);
      }

      return NextResponse.json({
        ok: true,
        cached: true,
        result: cached,
        entitlements: { isPro: ent.isPro },
      });
    }

    // ✅ gera resultado (beta)
    const result = buildResult(key, dre);

    // ✅ grava cache (se existir tabela)
    await writeCache(supabase, key, workspace_id, result);

    // ✅ incrementa uso no FREE
    if (!ent.isPro) {
      const used = await getAiUsageCount(supabase, user.id);
      await incAiUsageCount(supabase, user.id, used + 1);
    }

    return NextResponse.json({
      ok: true,
      cached: false,
      result,
      entitlements: { isPro: ent.isPro },
    });
  } catch (e: unknown) {
    console.error("[api/ai/dre-insights] ERROR:", e);
    return NextResponse.json({ ok: false, error: "Falha no endpoint de IA." }, { status: 500 });
  }
}
