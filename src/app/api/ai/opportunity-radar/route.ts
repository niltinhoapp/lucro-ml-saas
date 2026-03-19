import { NextResponse } from "next/server";
import { createServerClient } from "@/supabase/server";
import { getEntitlements } from "@/supabase/entitlements";
import { openai } from "@/lib/openai";

const RADAR_CACHE_MAX_AGE_MS = 1000 * 60 * 15;

type OpportunityItem = {
  nicho: string;
  demanda: "alta" | "média" | "baixa";
  concorrencia: "baixa" | "média" | "alta";
  preco_sugerido: number;
  ideia: string;
  diferencial: string;
};

type RadarResponse = {
  ok: true;
  traceId: string;
  produto: string;
  oportunidades: OpportunityItem[];
  cached?: boolean;
};

type RadarSearchRow = {
  id: string;
  user_id: string;
  query: string;
  site_id: string;
  payload: RadarResponse;
  created_at: string;
};

function getTraceId() {
  return `mlrad_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function safeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

function normalizeLevel(
  value: unknown,
  fallback: "alta" | "média" | "baixa"
): "alta" | "média" | "baixa" {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();

  if (raw === "alta" || raw === "média" || raw === "baixa") {
    return raw;
  }

  if (raw === "media") return "média";

  return fallback;
}

function normalizeCompetition(
  value: unknown
): "baixa" | "média" | "alta" {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();

  if (raw === "baixa" || raw === "média" || raw === "alta") {
    return raw;
  }

  if (raw === "media") return "média";

  return "média";
}

function toMoneyNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Number(n.toFixed(2));
}

function extractJsonObject(raw: string) {
  const trimmed = raw.trim();

  if (!trimmed) {
    throw new Error("IA_EMPTY_RESPONSE");
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("IA_PARSE_ERROR");
    }

    return JSON.parse(match[0]);
  }
}

function normalizeOpportunityItem(item: unknown): OpportunityItem | null {
  if (!item || typeof item !== "object") return null;

  const source = item as Record<string, unknown>;

  const nicho = String(source.nicho ?? "").trim();
  const ideia = String(source.ideia ?? "").trim();
  const diferencial = String(source.diferencial ?? "").trim();

  if (!nicho || !ideia || !diferencial) {
    return null;
  }

  return {
    nicho,
    demanda: normalizeLevel(source.demanda, "média"),
    concorrencia: normalizeCompetition(source.concorrencia),
    preco_sugerido: toMoneyNumber(source.preco_sugerido, 0),
    ideia,
    diferencial,
  };
}

function normalizeOpportunities(value: unknown): OpportunityItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(normalizeOpportunityItem)
    .filter((item): item is OpportunityItem => Boolean(item))
    .slice(0, 6);
}

async function getCachedRadar(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
  query: string
): Promise<RadarResponse | null> {
  const normalizedQuery = normalizeQuery(query);

  const { data, error } = await supabase
    .from("radar_searches")
    .select("id, user_id, query, site_id, payload, created_at")
    .eq("user_id", userId)
    .eq("query", normalizedQuery)
    .eq("site_id", "AI")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[radar ia] cache read error", error);
    return null;
  }

  const row = data as RadarSearchRow | null;
  if (!row?.payload) return null;

  const createdAtTs = new Date(row.created_at).getTime();
  if (!Number.isFinite(createdAtTs)) return null;

  const ageMs = Date.now() - createdAtTs;
  if (ageMs > RADAR_CACHE_MAX_AGE_MS) return null;

  return row.payload;
}

async function saveRadarSearch(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
  query: string,
  payload: RadarResponse
) {
  const normalizedQuery = normalizeQuery(query);
  const oportunidades = payload.oportunidades ?? [];

  const demandScore = oportunidades.filter((o) => o.demanda === "alta").length * 25;
  const competitionScore =
    oportunidades.filter((o) => o.concorrencia === "alta").length * 25;
  const opportunityScore = Math.max(
    0,
    Math.min(100, 70 + demandScore - competitionScore)
  );

  const avgPrice =
    oportunidades.length > 0
      ? Number(
          (
            oportunidades.reduce((sum, item) => sum + item.preco_sugerido, 0) /
            oportunidades.length
          ).toFixed(2)
        )
      : 0;

  const topOpportunity = oportunidades[0]
    ? {
        nicho: oportunidades[0].nicho,
        demanda: oportunidades[0].demanda,
        concorrencia: oportunidades[0].concorrencia,
        preco_sugerido: oportunidades[0].preco_sugerido,
        ideia: oportunidades[0].ideia,
      }
    : null;

  const { error } = await supabase.from("radar_searches").insert({
    user_id: userId,
    query: normalizedQuery,
    site_id: "AI",
    category_id: null,
    category_name: null,
    demand_score: demandScore,
    competition_score: competitionScore,
    opportunity_score: opportunityScore,
    active_listings: 0,
    unique_sellers: 0,
    avg_price: avgPrice,
    top_opportunity: topOpportunity,
    payload,
  });

  if (error) {
    console.error("[radar ia] cache write error", error);
  }
}

export async function POST(req: Request) {
  const traceId = getTraceId();

  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          ok: false,
          error: "UNAUTHENTICATED",
          traceId,
        },
        { status: 401 }
      );
    }

    const entitlements = await getEntitlements(supabase, user.id);

    if (!entitlements.isPlus) {
      return NextResponse.json(
        {
          ok: false,
          error: "PLUS_REQUIRED",
          message: "Disponível apenas para plano Plus.",
          traceId,
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const produto = String(body?.produto ?? "").trim();

    if (!produto) {
      return NextResponse.json(
        {
          ok: false,
          error: "PRODUCT_REQUIRED",
          message: "Informe um produto para analisar.",
          traceId,
        },
        { status: 400 }
      );
    }

    const cached = await getCachedRadar(supabase, user.id, produto);
    if (cached) {
      return NextResponse.json({
        ...cached,
        cached: true,
      });
    }

    const prompt = `
Você é um especialista em oportunidades de produto para vendedores do Mercado Livre no Brasil.

Produto base: "${produto}"

Objetivo:
Encontrar nichos e variações promissoras para o seller explorar, com foco em:
- demanda potencial
- concorrência relativa
- posicionamento de preço
- diferenciação prática

Regras:
- Não repita simplesmente o produto genérico.
- Priorize subnichos, versões premium, kits, aplicações específicas, públicos específicos e diferenciais reais.
- Seja prático e objetivo.
- Responda SOMENTE JSON válido.
- Use no máximo 6 oportunidades.

Formato exato:
{
  "oportunidades": [
    {
      "nicho": "string",
      "demanda": "alta",
      "concorrencia": "baixa",
      "preco_sugerido": 79.9,
      "ideia": "string",
      "diferencial": "string"
    }
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "Você responde apenas com JSON válido, sem markdown e sem texto extra.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = extractJsonObject(raw);
    const oportunidades = normalizeOpportunities(
      (parsed as Record<string, unknown>)?.oportunidades
    );

    if (!oportunidades.length) {
      throw new Error("IA_EMPTY_OPPORTUNITIES");
    }

    const responsePayload: RadarResponse = {
      ok: true,
      traceId,
      produto,
      oportunidades,
    };

    await saveRadarSearch(supabase, user.id, produto, responsePayload);

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("[radar ia] error", error);

    return NextResponse.json(
      {
        ok: false,
        error: safeErrorMessage(error),
        traceId,
      },
      { status: 500 }
    );
  }
}