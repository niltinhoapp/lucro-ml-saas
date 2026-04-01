import { NextRequest, NextResponse } from "next/server";
import { exchangeMlCode, fetchMlMe } from "@/lib/mercadolivre/client";
import { ML_STATE_COOKIE, ML_VERIFIER_COOKIE } from "@/lib/mercadolivre/oauth";
import { createServerClient } from "@/integrations/supabase/server";
import { canUseMlConnection, normalizeProfilePlan } from "@/lib/plans";

type ProfileRow = {
  plan: string | null;
};

type ExistingMlConnectionRow = {
  id: string;
  user_id: string;
  ml_user_id: number;
  ml_nickname: string | null;
  is_active?: boolean | null;
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

function safeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function getTraceId() {
  return `mlcb_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function maskValue(value: string | null | undefined, visible = 6) {
  if (!value) return null;
  if (value.length <= visible) return "*".repeat(value.length);
  return `${value.slice(0, visible)}***`;
}

function isHttpsRequest(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto");
  if (proto) return proto === "https";
  return req.nextUrl.protocol === "https:";
}

function buildRedirectUrl(
  req: NextRequest,
  mlStatus: MlOAuthCallbackStatus,
  detail?: string,
  traceId?: string
) {
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

function clearOauthCookies(req: NextRequest, response: NextResponse) {
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
) {
  const response = NextResponse.redirect(
    buildRedirectUrl(req, mlStatus, detail, traceId)
  );

  return clearOauthCookies(req, response);
}

function logStep(
  traceId: string,
  step: string,
  data?: Record<string, unknown>
) {
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

function toPositiveInteger(value: unknown) {
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
    logStep(traceId, "creating supabase server client");

    const supabase = await createServerClient();

    logStep(traceId, "fetching authenticated user");

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

    logStep(traceId, "authenticated user loaded", {
      userId: user.id,
      email: user.email ?? null,
    });

    logStep(traceId, "loading user profile plan", {
      userId: user.id,
    });

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

    logStep(traceId, "plan resolved", {
      userId: user.id,
      rawPlan: typedProfile?.plan ?? null,
      normalizedPlan: currentPlan,
    });

    if (!canUseMlConnection(currentPlan)) {
      logError(traceId, "plan does not allow ml connection", "Plan not allowed", {
        userId: user.id,
        plan: currentPlan,
      });

      return finish(
        req,
        "plan_upgrade_required",
        "Seu plano não permite conectar Mercado Livre.",
        traceId
      );
    }

    logStep(traceId, "exchanging authorization code for token");

    const tokenData = await exchangeMlCode({ code, codeVerifier });

    logStep(traceId, "token response received", {
      hasAccessToken: Boolean(tokenData?.access_token),
      hasRefreshToken: Boolean(tokenData?.refresh_token),
      tokenType: tokenData?.token_type ?? null,
      scope: tokenData?.scope ?? null,
      expiresIn: tokenData?.expires_in ?? null,
      mlUserIdFromToken: tokenData?.user_id ?? null,
    });

    if (!tokenData?.access_token) {
      logError(traceId, "missing access token after exchange", tokenData);
      return finish(req, "token_error", "access_token ausente.", traceId);
    }

    if (!tokenData?.refresh_token) {
      logError(traceId, "missing refresh token after exchange", tokenData);
      return finish(req, "token_error", "refresh_token ausente.", traceId);
    }

    logStep(traceId, "fetching ml /users/me profile");

    const me = await fetchMlMe(tokenData.access_token);
    const mlUserId = toPositiveInteger(me?.id);

    if (!mlUserId) {
      logError(traceId, "invalid ml profile returned", me);

      return finish(
        req,
        "ml_profile_error",
        "Perfil do Mercado Livre inválido.",
        traceId
      );
    }

    logStep(traceId, "ml profile fetched successfully", {
      mlUserId,
      mlNickname: me?.nickname ?? null,
    });

    logStep(traceId, "checking whether ml account is already linked elsewhere", {
      mlUserId,
      userId: user.id,
    });

    const { data: existingMlConnection, error: existingMlConnectionError } =
      await supabase
        .from("ml_connections")
        .select("id, user_id, ml_user_id, ml_nickname, is_active")
        .eq("ml_user_id", mlUserId)
        .maybeSingle();

    const typedExistingMlConnection =
      existingMlConnection as ExistingMlConnectionRow | null;

    if (existingMlConnectionError) {
      logError(
        traceId,
        "existing ml connection query failed",
        existingMlConnectionError,
        {
          mlUserId,
          userId: user.id,
        }
      );

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
      logError(traceId, "ml account already linked to another user", "Conflict", {
        currentUserId: user.id,
        existingUserId: typedExistingMlConnection.user_id,
        mlUserId: typedExistingMlConnection.ml_user_id,
        mlNickname: typedExistingMlConnection.ml_nickname,
      });

      return finish(
        req,
        "already_linked",
        "Esta conta do Mercado Livre já está vinculada a outro usuário.",
        traceId
      );
    }

    const now = new Date().toISOString();
    const { expiresAt, expiresInSeconds, usedFallback } = resolveExpiresAt(
      tokenData.expires_in
    );

    if (usedFallback) {
      logStep(traceId, "token expires_in missing or invalid, using fallback", {
        expiresInRaw: tokenData.expires_in ?? null,
        fallbackSeconds: expiresInSeconds,
      });
    }

    logStep(traceId, "disabling previous ml connections for user", {
      userId: user.id,
      keepingMlUserId: mlUserId,
    });

    const { error: deactivateUserConnectionsError } = await supabase
      .from("ml_connections")
      .update({
        is_active: false,
        updated_at: now,
      })
      .eq("user_id", user.id)
      .neq("ml_user_id", mlUserId);

    if (deactivateUserConnectionsError) {
      logError(
        traceId,
        "failed to deactivate previous user connections",
        deactivateUserConnectionsError,
        { userId: user.id, mlUserId }
      );

      return finish(
        req,
        "db_error",
        deactivateUserConnectionsError.message,
        traceId
      );
    }

    if (typedExistingMlConnection?.user_id === user.id) {
      logStep(traceId, "deactivating previous same-ml-user row before upsert", {
        existingConnectionId: typedExistingMlConnection.id,
        userId: user.id,
        mlUserId,
      });

      const { error: deactivateSameMlUserError } = await supabase
        .from("ml_connections")
        .update({
          is_active: false,
          updated_at: now,
        })
        .eq("ml_user_id", mlUserId)
        .eq("user_id", user.id);

      if (deactivateSameMlUserError) {
        logError(
          traceId,
          "failed to deactivate previous same-ml-user row",
          deactivateSameMlUserError,
          {
            existingConnectionId: typedExistingMlConnection.id,
            userId: user.id,
            mlUserId,
          }
        );

        return finish(
          req,
          "db_error",
          deactivateSameMlUserError.message,
          traceId
        );
      }
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

    logStep(traceId, "saving ml connection via upsert", {
      userId: payload.user_id,
      mlUserId: payload.ml_user_id,
      mlNickname: payload.ml_nickname,
      expiresAt: payload.expires_at,
      expiresInSeconds,
      hasAccessToken: Boolean(payload.access_token),
      hasRefreshToken: Boolean(payload.refresh_token),
    });

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

    logStep(traceId, "callback finished successfully", {
      userId: user.id,
      mlUserId,
    });

    return finish(req, "connected", undefined, traceId);
  } catch (error) {
    logError(traceId, "unexpected callback failure", error);

    return finish(req, "token_error", safeErrorMessage(error), traceId);
  }
}

