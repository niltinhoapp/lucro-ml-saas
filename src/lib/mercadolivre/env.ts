export type GetMlEnvInput = {
  origin?: string;
};

type MlEnv = Readonly<{
  appId: string;
  clientSecret: string;
  redirectUri: string;
  authUrl: string;
  tokenUrl: string;
  apiBaseUrl: string;
}>;

function mustEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }

  return value;
}

function optionalEnv(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

function removeTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizeOrigin(origin?: string): string {
  if (!origin) return "";
  return removeTrailingSlashes(origin.trim());
}

function ensureHttpUrl(name: string, value: string): string {
  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error(`${name} must use http:// or https://`);
    }

    return removeTrailingSlashes(url.toString());
  } catch {
    throw new Error(`Invalid ${name}: ${value}`);
  }
}

function validateRedirectUri(uri: string): string {
  try {
    const url = new URL(uri);
    const hostname = url.hostname.toLowerCase();

    const isHttps = url.protocol === "https:";
    const isAllowedLocalhost =
      url.protocol === "http:" &&
      (hostname === "localhost" || hostname === "127.0.0.1");

    if (!isHttps && !isAllowedLocalhost) {
      throw new Error();
    }

    return removeTrailingSlashes(url.toString());
  } catch {
    throw new Error(
      `Invalid ML redirect URI: must be https:// or http://localhost / http://127.0.0.1. Received: ${uri}`
    );
  }
}

function resolveBaseOrigin(input?: GetMlEnvInput): string {
  return (
    normalizeOrigin(input?.origin) ||
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeOrigin(process.env.SITE_URL) ||
    "http://localhost:3000"
  );
}

function resolveRedirectUri(input?: GetMlEnvInput): string {
  const envRedirectUri = process.env.ML_REDIRECT_URI?.trim();

  if (envRedirectUri) {
    return validateRedirectUri(envRedirectUri);
  }

  const origin = resolveBaseOrigin(input);
  return validateRedirectUri(`${origin}/api/ml/oauth/callback`);
}

export function getMlEnv(input?: GetMlEnvInput): MlEnv {
  const appId = mustEnv("ML_APP_ID");
  const clientSecret = mustEnv("ML_CLIENT_SECRET");
  const redirectUri = resolveRedirectUri(input);

  const authUrl = ensureHttpUrl(
    "ML_AUTH_URL",
    optionalEnv(
      "ML_AUTH_URL",
      "https://auth.mercadolivre.com.br/authorization"
    )
  );

  const tokenUrl = ensureHttpUrl(
    "ML_TOKEN_URL",
    optionalEnv("ML_TOKEN_URL", "https://api.mercadolibre.com/oauth/token")
  );

  const apiBaseUrl = ensureHttpUrl(
    "ML_API_BASE_URL",
    optionalEnv(
      "ML_API_BASE_URL",
      optionalEnv("ML_API_URL", "https://api.mercadolibre.com")
    )
  );

  return Object.freeze({
    appId,
    clientSecret,
    redirectUri,
    authUrl,
    tokenUrl,
    apiBaseUrl,
  });
}