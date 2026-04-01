import { NextResponse } from "next/server";
import { createServerClient } from "@/integrations/supabase/server";
import { getEntitlements } from "@/integrations/supabase/entitlements";
import { fetchMlMe, refreshMlToken } from "@/lib/mercadolivre/client";
import { saveRadarSearch } from "@/features/produtos/radar/server/saveRadarSearch";
import { generateRadarRecommendation } from "@/features/strategies/server/generateRadarRecommendation";

const ML_API_BASE = "https://api.mercadolibre.com";
const MLB_SITE_ID = "MLB";
const ML_TIMEOUT_MS = 20_000;

type MlSeller = {
  id?: number;
  nickname?: string;
  reputation?: { power_seller_status?: string | null };
};

type MlSearchItem = {
  id: string;
  title: string;
  price?: number;
  available_quantity?: number | string;
  sold_quantity?: number;
  seller?: MlSeller;
  shipping?: { free_shipping?: boolean; logistic_type?: string | null };
  permalink?: string;
  catalog_listing?: boolean;
};

type MlSearchResponse = {
  paging?: { total?: number };
  results?: MlSearchItem[];
};

type MlCategoryPrediction = {
  category_id?: string;
  category_name?: string;
  domain_id?: string;
  domain_name?: string;
};

type MlConnectionRow = {
  id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string | null;
  is_active: boolean | null;
  ml_nickname: string | null;
  ml_user_id: number | null;
  updated_at: string | null;
};

type ValidMlSession = {
  accessToken: string;
  sellerNickname: string | null;
  sellerMlUserId: number | null;
  refreshed: boolean;
};

type RadarOpportunity = {
  title: string;
  keyword: string;
  price: number;
  soldQuantity: number;
  competitionLevel: "baixa" | "média" | "alta";
  opportunityScore: number;
  sellerShare: number;
  shipping: string;
  permalink?: string;
};

type RadarPayload = {
  ok: true;
  traceId: string;
  source: "mercado_livre";
  sellerAccount: string | null;
  sellerMlUserId: number | null;
  produto: string;
  siteId: string;
  category: {
    id: string | null;
    name: string | null;
    domainId: string | null;
    domainName: string | null;
  };
  market: {
    activeListings: number;
    uniqueSellers: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    avgSoldQuantity: number;
    freeShippingRate: number;
    catalogRate: number;
    topSellerShare: number;
    competitionScore: number;
    demandScore: number;
    opportunityScore: number;
  };
  highlights: string[];
  opportunities: RadarOpportunity[];
  sellers: {
    seller: string;
    items: number;
    share: number;
    powerSeller: string;
  }[];
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

function logStep(
  traceId: string,
  step: string,
  data?: Record<string, unknown>
) {
  if (data) {
    console.log(`[radar ml][${traceId}] ${step}`, data);
    return;
  }

  console.log(`[radar ml][${traceId}] ${step}`);
}

function logError(
  traceId: string,
  step: string,
  error: unknown,
  extra?: Record<string, unknown>
) {
  console.error(`[radar ml][${traceId}] ${step}`, {
    error: safeErrorMessage(error),
    ...(extra ?? {}),
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toMoney(value: number) {
  return Number(value.toFixed(2));
}

function normalizeKeyword(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitleToKeyword(value: string) {
  return (
    normalizeKeyword(value)
      .split(" ")
      .filter((part) => part.length > 2)
      .slice(0, 6)
      .join(" ") || value.trim()
  );
}

function quantityToNumber(value: number | string | undefined) {
  if (typeof value === "number") return value;
  if (!value) return 0;

  const map: Record<string, number> = {
    RANGO_1_50: 1,
    RANGO_51_100: 50,
    RANGO_101_150: 100,
    RANGO_151_200: 150,
    RANGO_201_250: 200,
    RANGO_251_500: 250,
    RANGO_501_5000: 500,
    RANGO_5001_50000: 5000,
    RANGO_50001_99999: 50000,
  };

  return map[value] ?? 0;
}

function isConnectionExpired(expiresAt: string | null | undefined) {
  if (!expiresAt) return true;

  const ts = new Date(expiresAt).getTime();
  if (!Number.isFinite(ts)) return true;

  return ts <= Date.now() + 60_000;
}

function competitionLevelFromScore(score: number): "baixa" | "média" | "alta" {
  if (score <= 38) return "baixa";
  if (score <= 68) return "média";
  return "alta";
}

async function mlGet<T>(
  traceId: string,
  path: string,
  params: Record<string, string | number | undefined>,
  accessToken?: string | null
) {
  const url = new URL(`${ML_API_BASE}${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const isPrivateUsersEndpoint = path.startsWith("/users");

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    "User-Agent": "LucroML/1.0",
  };

  if (accessToken && isPrivateUsersEndpoint) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  logStep(traceId, "calling mercado livre endpoint", {
    path,
    url: url.toString(),
    hasAccessToken: Boolean(accessToken),
    sendingAuthorization: Boolean(accessToken && isPrivateUsersEndpoint),
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
      signal: controller.signal,
    });

    const raw = await response.text().catch(() => "");

    logStep(traceId, "mercado livre response received", {
      path,
      status: response.status,
      ok: response.ok,
      bodyPreview: raw.slice(0, 600),
    });

    if (!response.ok) {
      let parsed: any = null;

      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch {
        parsed = null;
      }

      const policyCode = parsed?.code;
      const blockedBy = parsed?.blocked_by;

      if (
        response.status === 403 &&
        policyCode === "PA_UNAUTHORIZED_RESULT_FROM_POLICIES"
      ) {
        throw new Error(
          `ML_POLICY_BLOCK: blocked_by=${blockedBy ?? "unknown"} code=${policyCode}`
        );
      }

      throw new Error(`Mercado Livre ${response.status}: ${raw || response.statusText}`);
    }

    return JSON.parse(raw) as T;
  } catch (error) {
    logError(traceId, "mercado livre request failed", error, {
      path,
      hasAccessToken: Boolean(accessToken),
      sendingAuthorization: Boolean(accessToken && isPrivateUsersEndpoint),
    });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function discoverCategory(traceId: string, query: string) {
  const rows = await mlGet<MlCategoryPrediction[]>(
    traceId,
    `/sites/${MLB_SITE_ID}/domain_discovery/search`,
    { q: query, limit: 1 }
  );

  return rows?.[0] ?? null;
}

async function searchItems(traceId: string, query: string, limit = 30) {
  return mlGet<MlSearchResponse>(traceId, `/sites/${MLB_SITE_ID}/search`, {
    q: query,
    limit,
  });
}

async function searchItemsByCategory(
  traceId: string,
  categoryId: string,
  limit = 20
) {
  return mlGet<MlSearchResponse>(traceId, `/sites/${MLB_SITE_ID}/search`, {
    category: categoryId,
    limit,
  });
}

async function refreshAndPersistConnection(
  traceId: string,
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  connection: MlConnectionRow
) {
  logStep(traceId, "refreshing ml token", {
    connectionId: connection.id,
    mlUserId: connection.ml_user_id,
    mlNickname: connection.ml_nickname,
  });

  const refreshed = await refreshMlToken(connection.refresh_token);

  if (!refreshed?.access_token) {
    throw new Error("access_token ausente na renovação");
  }

  if (!refreshed?.refresh_token) {
    throw new Error("refresh_token ausente na renovação");
  }

  const expiresInSeconds = Number(refreshed.expires_in ?? 21600);
  const safeExpiresInSeconds =
    Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
      ? expiresInSeconds
      : 21600;

  const expiresAt = new Date(
    Date.now() + safeExpiresInSeconds * 1000
  ).toISOString();

  const { error: updateError } = await supabase
    .from("ml_connections")
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      token_type: refreshed.token_type ?? "Bearer",
      scope: refreshed.scope ?? null,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
      is_active: true,
    })
    .eq("id", connection.id);

  if (updateError) {
    throw new Error(`Falha ao salvar token renovado: ${updateError.message}`);
  }

  logStep(traceId, "ml token refreshed successfully", {
    connectionId: connection.id,
    expiresAt,
  });

  return {
    accessToken: refreshed.access_token,
    expiresAt,
  };
}

async function ensureValidMlSession(
  traceId: string,
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  connection: MlConnectionRow
): Promise<ValidMlSession> {
  let accessToken = connection.access_token;
  let refreshed = false;

  if (!connection.is_active || !connection.access_token) {
    throw new Error("Conexão ML inativa ou sem access_token");
  }

  const expired = isConnectionExpired(connection.expires_at);

  logStep(traceId, "checking ml connection status", {
    connectionId: connection.id,
    expired,
    expiresAt: connection.expires_at,
    mlUserId: connection.ml_user_id,
    mlNickname: connection.ml_nickname,
  });

  if (expired) {
    const refreshedData = await refreshAndPersistConnection(
      traceId,
      supabase,
      connection
    );
    accessToken = refreshedData.accessToken;
    refreshed = true;
  }

  try {
    const me = await fetchMlMe(accessToken);

    if (!me?.id) {
      throw new Error("Perfil /users/me inválido");
    }

    if (
      connection.ml_user_id &&
      Number(connection.ml_user_id) !== Number(me.id)
    ) {
      throw new Error(
        "A conexão do Mercado Livre não corresponde à conta esperada"
      );
    }

    const sellerNickname = me.nickname ?? connection.ml_nickname ?? null;
    const sellerMlUserId = Number(me.id);

    const { error: syncError } = await supabase
      .from("ml_connections")
      .update({
        ml_nickname: sellerNickname,
        ml_user_id: sellerMlUserId,
        updated_at: new Date().toISOString(),
        is_active: true,
      })
      .eq("id", connection.id);

    if (syncError) {
      logError(traceId, "failed to sync ml connection after /users/me", syncError, {
        connectionId: connection.id,
      });
    }

    logStep(traceId, "ml session validated with /users/me", {
      connectionId: connection.id,
      sellerMlUserId,
      sellerNickname,
      refreshed,
    });

    return {
      accessToken,
      sellerNickname,
      sellerMlUserId,
      refreshed,
    };
  } catch (firstError) {
    logError(traceId, "first ml session validation failed", firstError, {
      connectionId: connection.id,
      willForceRefresh: true,
    });

    const refreshedData = await refreshAndPersistConnection(
      traceId,
      supabase,
      connection
    );

    accessToken = refreshedData.accessToken;
    refreshed = true;

    const me = await fetchMlMe(accessToken);

    if (!me?.id) {
      throw new Error("Perfil /users/me inválido após refresh");
    }

    if (
      connection.ml_user_id &&
      Number(connection.ml_user_id) !== Number(me.id)
    ) {
      throw new Error(
        "A conexão do Mercado Livre não corresponde à conta esperada após refresh"
      );
    }

    const sellerNickname = me.nickname ?? connection.ml_nickname ?? null;
    const sellerMlUserId = Number(me.id);

    const { error: syncError } = await supabase
      .from("ml_connections")
      .update({
        ml_nickname: sellerNickname,
        ml_user_id: sellerMlUserId,
        updated_at: new Date().toISOString(),
        is_active: true,
      })
      .eq("id", connection.id);

    if (syncError) {
      logError(traceId, "failed to sync ml connection after forced refresh", syncError, {
        connectionId: connection.id,
      });
    }

    logStep(traceId, "ml session validated after forced refresh", {
      connectionId: connection.id,
      sellerMlUserId,
      sellerNickname,
    });

    return {
      accessToken,
      sellerNickname,
      sellerMlUserId,
      refreshed,
    };
  }
}

function buildRadarPayload(params: {
  traceId: string;
  produto: string;
  sellerNickname: string | null;
  sellerMlUserId: number | null;
  category: MlCategoryPrediction | null;
  searchResults: MlSearchItem[];
  categorySearchResults: MlSearchItem[];
  pagingTotal: number;
}): RadarPayload {
  const {
    traceId,
    produto,
    sellerNickname,
    sellerMlUserId,
    category,
    searchResults,
    categorySearchResults,
    pagingTotal,
  } = params;

  const prices = searchResults
    .map((item) => Number(item.price ?? 0))
    .filter((value) => value > 0);

  const solds = searchResults.map((item) => Number(item.sold_quantity ?? 0));
  const freeShippingCount = searchResults.filter(
    (item) => item.shipping?.free_shipping
  ).length;
  const catalogCount = searchResults.filter((item) => item.catalog_listing).length;

  const sellerCounter = new Map<
    string,
    { seller: string; count: number; powerSeller: string }
  >();

  for (const item of searchResults) {
    const sellerId = String(item.seller?.id ?? item.seller?.nickname ?? item.id);
    const sellerName = item.seller?.nickname ?? `Seller ${sellerId}`;
    const existing = sellerCounter.get(sellerId);

    if (existing) {
      existing.count += 1;
    } else {
      sellerCounter.set(sellerId, {
        seller: sellerName,
        count: 1,
        powerSeller: item.seller?.reputation?.power_seller_status ?? "normal",
      });
    }
  }

  const sellers = [...sellerCounter.values()].sort((a, b) => b.count - a.count);
  const uniqueSellers = sellers.length;
  const activeListings = Number(pagingTotal ?? searchResults.length);
  const topSellerShare = searchResults.length
    ? (sellers[0]?.count ?? 0) / searchResults.length
    : 0;

  const competitionScore = Math.round(
    clamp(
      topSellerShare * 45 +
        clamp(activeListings / 12000, 0, 1) * 40 +
        clamp((uniqueSellers / Math.max(1, activeListings)) * 1.8, 0, 1) * 15,
      0,
      100
    )
  );

  const demandScore = Math.round(
    (
      clamp(
        solds.reduce((a, b) => a + b, 0) / Math.max(1, solds.length) / 80,
        0,
        1
      ) *
        0.7 +
      clamp(activeListings / 4000, 0, 1) * 0.3
    ) * 100
  );

  const avgPriceBase = prices.reduce((a, b) => a + b, 0) / prices.length;

  const priceSpreadRatio =
    (Math.max(...prices) - Math.min(...prices)) / Math.max(1, avgPriceBase);

  const opportunityScore = Math.round(
    clamp(
      demandScore * 0.5 +
        (100 - competitionScore) * 0.4 +
        clamp(priceSpreadRatio, 0, 1) * 10,
      0,
      100
    )
  );

  const pool = [...searchResults, ...categorySearchResults]
    .filter(
      (item, index, arr) =>
        arr.findIndex((other) => other.id === item.id) === index
    )
    .slice(0, 18);

  const opportunities: RadarOpportunity[] = pool
    .map((item) => {
      const soldQuantity = Number(item.sold_quantity ?? 0);

      const itemCompetition = clamp(
        competitionScore * 0.65 +
          clamp(quantityToNumber(item.available_quantity) / 500, 0, 1) * 35,
        0,
        100
      );

      return {
        title: item.title,
        keyword: normalizeTitleToKeyword(item.title),
        price: toMoney(Number(item.price ?? 0)),
        soldQuantity,
        competitionLevel: competitionLevelFromScore(itemCompetition),
        opportunityScore: Math.round(
          clamp(
            demandScore * 0.45 +
              clamp(soldQuantity / 120, 0, 1) * 30 +
              (100 - itemCompetition) * 0.25,
            0,
            100
          )
        ),
        sellerShare: Number((topSellerShare * 100).toFixed(1)),
        shipping: item.shipping?.free_shipping
          ? "frete grátis"
          : item.shipping?.logistic_type ?? "a validar",
        permalink: item.permalink,
      };
    })
    .sort(
      (a, b) =>
        b.opportunityScore - a.opportunityScore ||
        b.soldQuantity - a.soldQuantity
    )
    .slice(0, 8);

  return {
    ok: true,
    traceId,
    source: "mercado_livre",
    sellerAccount: sellerNickname,
    sellerMlUserId,
    produto,
    siteId: MLB_SITE_ID,
    category: {
      id: category?.category_id ?? null,
      name: category?.category_name ?? null,
      domainId: category?.domain_id ?? null,
      domainName: category?.domain_name ?? null,
    },
    market: {
      activeListings,
      uniqueSellers,
      avgPrice: toMoney(avgPriceBase),
      minPrice: toMoney(Math.min(...prices)),
      maxPrice: toMoney(Math.max(...prices)),
      avgSoldQuantity: Math.round(
        solds.reduce((a, b) => a + b, 0) / Math.max(1, solds.length)
      ),
      freeShippingRate: Math.round(
        (freeShippingCount / Math.max(1, searchResults.length)) * 100
      ),
      catalogRate: Math.round(
        (catalogCount / Math.max(1, searchResults.length)) * 100
      ),
      topSellerShare: Math.round(topSellerShare * 100),
      competitionScore,
      demandScore,
      opportunityScore,
    },
    highlights: [
      `${activeListings.toLocaleString("pt-BR")} anúncios ativos encontrados para “${produto}”.`,
      `${uniqueSellers.toLocaleString("pt-BR")} sellers distintos apareceram na amostra principal.`,
      `Faixa de preço observada: R$ ${toMoney(Math.min(...prices)).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })} até R$ ${toMoney(Math.max(...prices)).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })}.`,
      `Frete grátis aparece em ${Math.round(
        (freeShippingCount / Math.max(1, searchResults.length)) * 100
      )}% dos anúncios analisados.`,
      topSellerShare >= 0.35
        ? "Atenção: poucos sellers concentram boa parte da vitrine dessa busca."
        : "Boa notícia: a vitrine parece menos concentrada entre os sellers do topo.",
    ],
    opportunities,
    sellers: sellers.slice(0, 6).map((seller) => ({
      seller: seller.seller,
      items: seller.count,
      share: Math.round((seller.count / Math.max(1, searchResults.length)) * 100),
      powerSeller: seller.powerSeller,
    })),
  };
}

export async function POST(req: Request) {
  const traceId = getTraceId();

  try {
    logStep(traceId, "route started");

    const supabase = await createServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      logError(traceId, "user not authenticated", userError ?? "No user");

      return NextResponse.json(
        {
          ok: false,
          error: "Faça login para usar o radar.",
          traceId,
        },
        { status: 401 }
      );
    }

    logStep(traceId, "authenticated user loaded", {
      userId: user.id,
      email: user.email ?? null,
    });

    const ent = await getEntitlements(supabase, user.id);

    if (!ent.isPlus) {
      return NextResponse.json(
        {
          ok: false,
          error: "O Radar ML está disponível apenas no plano PLUS.",
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
          error: "Informe um produto para consultar.",
          traceId,
        },
        { status: 400 }
      );
    }

    const { data: connection, error: connectionError } = await supabase
      .from("ml_connections")
      .select(
        "id, access_token, refresh_token, expires_at, is_active, ml_nickname, ml_user_id, updated_at"
      )
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const typedConnection = connection as MlConnectionRow | null;

    if (connectionError) {
      logError(traceId, "failed to load ml connection", connectionError, {
        userId: user.id,
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Não foi possível validar a conexão da sua conta Mercado Livre.",
          detail: connectionError.message,
          traceId,
        },
        { status: 500 }
      );
    }

    if (!typedConnection?.is_active || !typedConnection?.access_token) {
      return NextResponse.json(
        {
          ok: false,
          error: "Conecte sua conta do Mercado Livre antes de usar o Radar ML.",
          traceId,
        },
        { status: 400 }
      );
    }

    let session: ValidMlSession;

    try {
      session = await ensureValidMlSession(traceId, supabase, typedConnection);
    } catch (error) {
      const detail = safeErrorMessage(error);

      logError(traceId, "ml session validation failed", error, {
        connectionId: typedConnection.id,
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Não foi possível validar sua conta do Mercado Livre. Reconecte e tente novamente.",
          detail,
          traceId,
        },
        { status: 403 }
      );
    }

    let category: MlCategoryPrediction | null = null;
    let search: MlSearchResponse;

    try {
      [category, search] = await Promise.all([
        discoverCategory(traceId, produto).catch((error) => {
          logError(traceId, "category discovery failed", error, { produto });
          return null;
        }),
        searchItems(traceId, produto, 30),
      ]);
    } catch (error) {
      const detail = safeErrorMessage(error);

      if (detail.includes("ML_POLICY_BLOCK")) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "O Mercado Livre bloqueou esta consulta pela política da API. Essa busca pública não está autorizada no ambiente atual.",
            detail,
            traceId,
            blockedByPolicy: true,
          },
          { status: 502 }
        );
      }

      return NextResponse.json(
        {
          ok: false,
          error: "Não foi possível consultar os anúncios no Mercado Livre.",
          detail,
          traceId,
        },
        { status: 502 }
      );
    }

    const searchResults = (search.results ?? []).filter(
      (item) => Number(item.price ?? 0) > 0
    );

    if (!searchResults.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "Nenhum anúncio encontrado para essa busca no Mercado Livre.",
          traceId,
        },
        { status: 404 }
      );
    }

    const categorySearch = category?.category_id
      ? await searchItemsByCategory(traceId, category.category_id, 20).catch(
          (error) => {
            logError(traceId, "category search failed", error, {
              categoryId: category?.category_id,
            });
            return null;
          }
        )
      : null;

    const categorySearchResults = (categorySearch?.results ?? []).filter(
      (item) => Number(item.price ?? 0) > 0
    );

    const payload = buildRadarPayload({
      traceId,
      produto,
      sellerNickname: session.sellerNickname,
      sellerMlUserId: session.sellerMlUserId,
      category,
      searchResults,
      categorySearchResults,
      pagingTotal: Number(search.paging?.total ?? searchResults.length),
    });

    try {
      await saveRadarSearch({
        userId: user.id,
        query: produto,
        avgPrice: payload.market.avgPrice,
        demandScore: payload.market.demandScore,
        competitionScore: payload.market.competitionScore,
        opportunityScore: payload.market.opportunityScore,
        payload,
      });

      logStep(traceId, "radar search saved", {
        userId: user.id,
        produto,
      });
    } catch (error) {
      logError(traceId, "failed to save radar history", error, {
        userId: user.id,
        produto,
      });
    }

    try {
      await generateRadarRecommendation({
        userId: user.id,
        query: produto,
        opportunityScore: payload.market.opportunityScore,
        demandScore: payload.market.demandScore,
        competitionScore: payload.market.competitionScore,
      });

      logStep(traceId, "radar recommendation generated", {
        userId: user.id,
        produto,
      });
    } catch (error) {
      logError(traceId, "failed to generate radar recommendation", error, {
        userId: user.id,
        produto,
      });
    }

    logStep(traceId, "route finished successfully", {
      userId: user.id,
      produto,
      opportunities: payload.opportunities.length,
    });

    return NextResponse.json(payload);
  } catch (error) {
    const detail = safeErrorMessage(error);

    console.error(`[radar ml][fatal][${traceId}]`, detail);

    return NextResponse.json(
      {
        ok: false,
        error: "Não foi possível consultar o Mercado Livre agora.",
        detail,
        traceId,
      },
      { status: 500 }
    );
  }
}