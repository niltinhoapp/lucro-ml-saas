
import { NextRequest, NextResponse } from "next/server";
import { getMlEnv } from "@/lib/mercadolivre/env";
import { exchangeMlCode, fetchMlMe } from "@/lib/mercadolivre/client";
import { ML_STATE_COOKIE, ML_VERIFIER_COOKIE } from "@/lib/mercadolivre/oauth";
import { createServerClient } from "@/supabase/server";
import { canUseMlConnection, normalizeProfilePlan } from "@/lib/plans";

type ProfileRow = {
  plan: string | null;
};

type ExistingMlConnectionRow = {
  id: string;
  user_id: string;
  ml_user_id: number;
  ml_nickname: string | null;
  is_active: boolean | null;
};

type SavedMlConnectionRow = {
  id: string;
  user_id: string;
  ml_user_id: number;
  ml_nickname: string | null;
  is_active: boolean;
  updated_at: string;
};

type MlConnectionUpsertPayload = {
  user_id: string;
  ml_user_id: number;
  ml_nickname: string | null;
  access_token: string;
  refresh_token: string;
  token_type: string;
  scope: string | null;
  expires_at: string;
  connected_at: string;
  updated_at: string;
  raw_profile: unknown;
  is_active: boolean;
};

type MlOAuthCallbackStatus =
  | "connected"
  | "state_error"
  | "oauth_denied"
  | "login_required"
  | "profile_error"
  | "plan_upgrade_required"
  | "token_error"
  | "ml_profile_error"
  | "db_error"
  | "already_linked";

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function getTraceId(): string {
  return `mlcb_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function maskValue(value: string | null | undefined, visible = 6): string | null {
  if (!value) return null;
  if (value.length <= visible) return "*".repeat(value.length);
  return `${value.slice(0, visible)}***`;
}

function isHttpsRequest(req: NextRequest): boolean {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  if (forwardedProto) return forwardedProto === "https";
  return req.nextUrl.protocol === "https:";
}

function buildRedirectUrl(
  req: NextRequest,
  mlStatus: MlOAuthCallbackStatus,
  detail?: string,
  traceId?: string
): URL {
  const url = new URL("/dashboard/conta", req.url);

  url.searchParams.set("ml", mlStatus);

  if (detail) {
    url.searchParams.set("detail", detail);
  }

  if (traceId) {
    url.searchParams.set("trace", traceId);
  }

  return url;
}

function clearOauthCookies(req: NextRequest, response: NextResponse): NextResponse {
  const secure = isHttpsRequest(req);

  response.cookies.set(ML_STATE_COOKIE, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure,
  });

  response.cookies.set(ML_VERIFIER_COOKIE, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure,
  });

  return response;
}

function finish(
  req: NextRequest,
  mlStatus: MlOAuthCallbackStatus,
  detail?: string,
  traceId?: string
): NextResponse {
  const response = NextResponse.redirect(
    buildRedirectUrl(req, mlStatus, detail, traceId)
  );

  return clearOauthCookies(req, response);
}

function logStep(traceId: string, step: string, data?: Record<string, unknown>) {
  if (data) {
    console.log(`[ml oauth callback][${traceId}] ${step}`, data);
    return;
  }

  console.log(`[ml oauth callback][${traceId}] ${step}`);
}

function logError(
  traceId: string,
  step: string,
  error: unknown,
  extra?: Record<string, unknown>
) {
  console.error(`[ml oauth callback][${traceId}] ${step}`, {
    error: safeErrorMessage(error),
    ...(extra ?? {}),
  });
}

function toPositiveInteger(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function resolveExpiresAt(expiresInRaw: unknown) {
  const expiresInSeconds = Number(expiresInRaw);

  const safeExpiresInSeconds =
    Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
      ? expiresInSeconds
      : 21600;

  return {
    expiresInSeconds: safeExpiresInSeconds,
    expiresAt: new Date(Date.now() + safeExpiresInSeconds * 1000).toISOString(),
    usedFallback:
      !Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0,
  };
}

function getRequestOrigin(req: NextRequest): string {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = req.headers.get("host");

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  if (host) {
    const hostname = host.toLowerCase();
    const protocol =
      hostname.includes("localhost") || hostname.includes("127.0.0.1")
        ? "http"
        : "https";

    return `${protocol}://${host}`;
  }

  return req.nextUrl.origin;
}

export async function GET(req: NextRequest) {
  const traceId = getTraceId();

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const oauthError = req.nextUrl.searchParams.get("error");
  const oauthErrorDescription =
    req.nextUrl.searchParams.get("error_description") ??
    req.nextUrl.searchParams.get("error_message");

  const expectedState = req.cookies.get(ML_STATE_COOKIE)?.value;
  const codeVerifier = req.cookies.get(ML_VERIFIER_COOKIE)?.value;

  logStep(traceId, "callback started", {
    pathname: req.nextUrl.pathname,
    hasCode: Boolean(code),
    hasState: Boolean(state),
    hasExpectedState: Boolean(expectedState),
    hasCodeVerifier: Boolean(codeVerifier),
    oauthError: oauthError ?? null,
  });

  if (oauthError) {
    logError(traceId, "oauth provider returned error", oauthError, {
      oauthErrorDescription,
    });

    return finish(
      req,
      "oauth_denied",
      oauthErrorDescription || oauthError,
      traceId
    );
  }

  if (!code || !state || !expectedState || !codeVerifier) {
    logError(traceId, "missing oauth params", "Missing params", {
      hasCode: Boolean(code),
      hasState: Boolean(state),
      hasExpectedState: Boolean(expectedState),
      hasCodeVerifier: Boolean(codeVerifier),
      stateReceived: state ?? null,
      expectedStatePreview: maskValue(expectedState),
      codePreview: maskValue(code),
      codeVerifierPreview: maskValue(codeVerifier),
    });

    return finish(req, "state_error", "Parâmetros OAuth ausentes.", traceId);
  }

  if (state !== expectedState) {
    logError(traceId, "invalid oauth state", "State mismatch", {
      receivedStatePreview: maskValue(state),
      expectedStatePreview: maskValue(expectedState),
    });

    return finish(req, "state_error", "State inválido.", traceId);
  }

  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      logError(traceId, "authenticated user not available", userError ?? "No user", {
        hasUser: Boolean(user),
      });

      return finish(
        req,
        "login_required",
        "Usuário não autenticado.",
        traceId
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();

    const typedProfile = profile as ProfileRow | null;

    if (profileError) {
      logError(traceId, "profile query failed", profileError, {
        userId: user.id,
      });

      return finish(req, "profile_error", profileError.message, traceId);
    }

    const currentPlan = normalizeProfilePlan(typedProfile?.plan);

    if (!canUseMlConnection(currentPlan)) {
      return finish(
        req,
        "plan_upgrade_required",
        "A conexão com o Mercado Livre está disponível apenas no plano Plus.",
        traceId
      );
    }

    const requestOrigin = getRequestOrigin(req);
    const env = getMlEnv({ origin: requestOrigin });

    logStep(traceId, "callback env resolved", {
      requestOrigin,
      redirectUri: env.redirectUri,
    });

    let tokenData;
    try {
      tokenData = await exchangeMlCode({
        code,
        codeVerifier,
        redirectUri: env.redirectUri,
      });
    } catch (error) {
      logError(traceId, "token exchange failed", error, {
        requestOrigin,
        redirectUri: env.redirectUri,
        hasCode: Boolean(code),
        hasCodeVerifier: Boolean(codeVerifier),
      });

      return finish(req, "token_error", safeErrorMessage(error), traceId);
    }

    logStep(traceId, "token exchange succeeded", {
      hasAccessToken: Boolean(tokenData?.access_token),
      hasRefreshToken: Boolean(tokenData?.refresh_token),
      tokenType: tokenData?.token_type ?? null,
      expiresIn: tokenData?.expires_in ?? null,
      tokenUserId: tokenData?.user_id ?? null,
    });

    if (!tokenData?.access_token) {
      return finish(req, "token_error", "access_token ausente.", traceId);
    }

    if (!tokenData?.refresh_token) {
      return finish(req, "token_error", "refresh_token ausente.", traceId);
    }

    let me;
    try {
      me = await fetchMlMe(tokenData.access_token);
    } catch (error) {
      logError(traceId, "ml profile fetch failed", error, {
        hasAccessToken: Boolean(tokenData?.access_token),
        tokenUserId: tokenData?.user_id ?? null,
      });

      return finish(req, "ml_profile_error", safeErrorMessage(error), traceId);
    }

    const mlUserId = toPositiveInteger(me?.id ?? tokenData?.user_id);

    if (!mlUserId) {
      return finish(
        req,
        "ml_profile_error",
        "Perfil do Mercado Livre inválido.",
        traceId
      );
    }

    const { data: existingMlConnection, error: existingMlConnectionError } =
      await supabase
        .from("ml_connections")
        .select("id, user_id, ml_user_id, ml_nickname, is_active")
        .eq("ml_user_id", mlUserId)
        .eq("is_active", true)
        .maybeSingle();

    const typedExistingMlConnection =
      existingMlConnection as ExistingMlConnectionRow | null;

    if (existingMlConnectionError) {
      return finish(
        req,
        "db_error",
        existingMlConnectionError.message,
        traceId
      );
    }

    if (
      typedExistingMlConnection &&
      typedExistingMlConnection.user_id !== user.id
    ) {
      return finish(
        req,
        "already_linked",
        "Esta conta do Mercado Livre já está vinculada a outro usuário.",
        traceId
      );
    }

    const now = new Date().toISOString();
    const { expiresAt } = resolveExpiresAt(tokenData.expires_in);

    const { error: deactivateOtherConnectionsError } = await supabase
      .from("ml_connections")
      .update({
        is_active: false,
        updated_at: now,
      })
      .eq("user_id", user.id)
      .neq("ml_user_id", mlUserId);

    if (deactivateOtherConnectionsError) {
      return finish(
        req,
        "db_error",
        deactivateOtherConnectionsError.message,
        traceId
      );
    }

    const payload: MlConnectionUpsertPayload = {
      user_id: user.id,
      ml_user_id: mlUserId,
      ml_nickname: me?.nickname ?? null,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type ?? "Bearer",
      scope: tokenData.scope ?? null,
      expires_at: expiresAt,
      connected_at: now,
      updated_at: now,
      raw_profile: me,
      is_active: true,
    };

    const { data: savedConnection, error: upsertError } = await supabase
      .from("ml_connections")
      .upsert(payload, {
        onConflict: "user_id",
      })
      .select("id, user_id, ml_user_id, ml_nickname, is_active, updated_at")
      .maybeSingle();

    const typedSavedConnection = savedConnection as SavedMlConnectionRow | null;

    if (upsertError) {
      logError(traceId, "ml connection upsert failed", upsertError, {
        userId: payload.user_id,
        mlUserId: payload.ml_user_id,
      });

      return finish(req, "db_error", upsertError.message, traceId);
    }

    logStep(traceId, "ml connection saved successfully", {
      savedConnectionId: typedSavedConnection?.id ?? null,
      userId: typedSavedConnection?.user_id ?? null,
      mlUserId: typedSavedConnection?.ml_user_id ?? null,
      mlNickname: typedSavedConnection?.ml_nickname ?? null,
      isActive: typedSavedConnection?.is_active ?? null,
      updatedAt: typedSavedConnection?.updated_at ?? null,
    });

    return finish(req, "connected", undefined, traceId);
  } catch (error) {
    logError(traceId, "unexpected callback failure", error);
    return finish(req, "token_error", safeErrorMessage(error), traceId);
  }
}
