import { getMlEnv } from "@/lib/mercadolivre/env";

const ML_HTTP_TIMEOUT_MS = 20_000;

export type MlTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  user_id?: number;
  refresh_token?: string;
  error?: string;
  message?: string;
  status?: number;
  cause?: unknown;
};

export type MlUserProfile = {
  id: number;
  nickname?: string;
  first_name?: string;
  last_name?: string;
  permalink?: string;
  site_id?: string;
  email?: string;
};

type MlApiErrorPayload = {
  message?: string;
  error?: string;
  status?: number;
  cause?: unknown;
};

function stringifyUnknown(value: unknown): string {
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function logMl(step: string, data?: Record<string, unknown>) {
  if (data) {
    console.log(`[ml client] ${step}`, data);
    return;
  }

  console.log(`[ml client] ${step}`);
}

function logMlError(step: string, error: unknown, data?: Record<string, unknown>) {
  console.error(`[ml client] ${step}`, {
    error: error instanceof Error ? error.message : stringifyUnknown(error),
    ...(data ?? {}),
  });
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    return await response.text();
  } catch {
    return "";
  }
}

function buildErrorMessage(prefix: string, status: number, body: unknown): string {
  if (body && typeof body === "object") {
    const payload = body as MlApiErrorPayload;

    const parts = [
      payload.error || null,
      payload.message || null,
      payload.status ? `status=${payload.status}` : null,
      payload.cause ? `cause=${stringifyUnknown(payload.cause)}` : null,
    ].filter(Boolean);

    if (parts.length > 0) {
      return `${prefix}: ${status} ${parts.join(" | ")}`;
    }
  }

  return `${prefix}: ${status} ${stringifyUnknown(body)}`;
}

function isProbablyExpiredOrInvalidToken(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;

  const payload = body as MlApiErrorPayload;
  const raw = `${payload.error ?? ""} ${payload.message ?? ""}`.toLowerCase();

  return (
    raw.includes("invalid_token") ||
    raw.includes("invalid token") ||
    raw.includes("expired_token") ||
    raw.includes("expired token") ||
    raw.includes("token expired") ||
    raw.includes("unauthorized")
  );
}

async function ensureOk<T>(response: Response, prefix: string): Promise<T> {
  const body = await readResponseBody(response);

  if (!response.ok) {
    const message = buildErrorMessage(prefix, response.status, body);
    const err = new Error(message) as Error & {
      status?: number;
      body?: unknown;
      isAuthError?: boolean;
    };

    err.status = response.status;
    err.body = body;
    err.isAuthError =
      response.status === 401 ||
      response.status === 403 ||
      isProbablyExpiredOrInvalidToken(body);

    throw err;
  }

  return body as T;
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs = ML_HTTP_TIMEOUT_MS
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Mercado Livre request timeout após ${timeoutMs}ms`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function postOAuthToken(
  params: Record<string, string>,
  prefix: string
): Promise<MlTokenResponse> {
  const env = getMlEnv();

  const body = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    body.set(key, value);
  }

  const safeParamsForLog = {
    grant_type: params.grant_type,
    hasClientId: Boolean(params.client_id),
    hasClientSecret: Boolean(params.client_secret),
    hasCode: Boolean(params.code),
    hasRefreshToken: Boolean(params.refresh_token),
    hasCodeVerifier: Boolean(params.code_verifier),
    redirectUri: params.redirect_uri ?? null,
  };

  logMl("oauth token request started", safeParamsForLog);

  try {
    const response = await fetchWithTimeout(env.tokenUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      cache: "no-store",
    });

    const data = await ensureOk<MlTokenResponse>(response, prefix);

    if (!data?.access_token) {
      throw new Error(`${prefix}: resposta sem access_token`);
    }

    logMl("oauth token request succeeded", {
      grantType: params.grant_type,
      hasRefreshToken: Boolean(data.refresh_token),
      expiresIn: data.expires_in ?? null,
      tokenType: data.token_type ?? null,
      userId: data.user_id ?? null,
    });

    return data;
  } catch (error) {
    logMlError("oauth token request failed", error, {
      ...safeParamsForLog,
      tokenUrl: env.tokenUrl,
    });
    throw error;
  }
}

export async function exchangeMlCode(params: {
  code: string;
  codeVerifier: string;
}): Promise<MlTokenResponse> {
  const env = getMlEnv();

  const code = params.code?.trim();
  const codeVerifier = params.codeVerifier?.trim();

  if (!code) {
    throw new Error("Mercado Livre token error: code ausente");
  }

  if (!codeVerifier) {
    throw new Error("Mercado Livre token error: code_verifier ausente");
  }

  return postOAuthToken(
    {
      grant_type: "authorization_code",
      client_id: env.appId,
      client_secret: env.clientSecret,
      code,
      redirect_uri: env.redirectUri,
      code_verifier: codeVerifier,
    },
    "Mercado Livre token error"
  );
}

export async function refreshMlToken(
  refreshToken: string
): Promise<MlTokenResponse> {
  const env = getMlEnv();
  const normalizedRefreshToken = refreshToken?.trim();

  if (!normalizedRefreshToken) {
    throw new Error("Mercado Livre refresh error: refresh_token ausente");
  }

  return postOAuthToken(
    {
      grant_type: "refresh_token",
      client_id: env.appId,
      client_secret: env.clientSecret,
      refresh_token: normalizedRefreshToken,
    },
    "Mercado Livre refresh error"
  );
}

export async function fetchMlMe(accessToken: string): Promise<MlUserProfile> {
  const env = getMlEnv();
  const normalizedAccessToken = accessToken?.trim();

  if (!normalizedAccessToken) {
    throw new Error("Mercado Livre /users/me error: access_token ausente");
  }

  logMl("/users/me request started", {
    apiBaseUrl: env.apiBaseUrl,
    hasAccessToken: true,
  });

  try {
    const response = await fetchWithTimeout(`${env.apiBaseUrl}/users/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${normalizedAccessToken}`,
        accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await ensureOk<MlUserProfile>(
      response,
      "Mercado Livre /users/me error"
    );

    if (!data?.id) {
      throw new Error("Mercado Livre /users/me error: resposta sem id do usuário");
    }

    logMl("/users/me request succeeded", {
      userId: data.id,
      nickname: data.nickname ?? null,
      siteId: data.site_id ?? null,
    });

    return data;
  } catch (error) {
    logMlError("/users/me request failed", error, {
      apiBaseUrl: env.apiBaseUrl,
      hasAccessToken: true,
    });
    throw error;
  }
}
