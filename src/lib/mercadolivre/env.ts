function mustEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }

  return value;
}

function optionalEnv(name: string, fallback: string) {
  const value = process.env[name]?.trim();
  return value || fallback;
}

function ensureHttpUrl(name: string, value: string) {
  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error(`${name} must use http:// or https://`);
    }

    return value;
  } catch {
    throw new Error(`Invalid ${name}: ${value}`);
  }
}

function validateRedirectUri(uri: string) {
  try {
    const url = new URL(uri);
    const hostname = url.hostname.toLowerCase();

    const isHttps = url.protocol === "https:";
    const isLocalhost =
      url.protocol === "http:" &&
      (hostname === "localhost" || hostname === "127.0.0.1");

    if (!isHttps && !isLocalhost) {
      throw new Error(
        `Invalid ML_REDIRECT_URI: must use https:// or http://localhost. Received: ${uri}`
      );
    }

    return uri;
  } catch {
    throw new Error(
      `Invalid ML_REDIRECT_URI: must be a valid absolute URL. Received: ${uri}`
    );
  }
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export function getMlEnv() {
  const appId = mustEnv("ML_APP_ID");
  const clientSecret = mustEnv("ML_CLIENT_SECRET");
  const redirectUri = validateRedirectUri(mustEnv("ML_REDIRECT_URI"));

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
    process.env.ML_API_BASE_URL?.trim() ||
      process.env.ML_API_URL?.trim() ||
      "https://api.mercadolibre.com"
  );

  const env = Object.freeze({
    appId,
    clientSecret,
    redirectUri,
    authUrl: normalizeBaseUrl(authUrl),
    tokenUrl: normalizeBaseUrl(tokenUrl),
    apiBaseUrl: normalizeBaseUrl(apiBaseUrl),
  });

  console.log("[ml env] loaded", {
    appId: env.appId,
    redirectUri: env.redirectUri,
    authUrl: env.authUrl,
    tokenUrl: env.tokenUrl,
    apiBaseUrl: env.apiBaseUrl,
    hasClientSecret: Boolean(env.clientSecret),
    nodeEnv: process.env.NODE_ENV ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
  });

  return env;
}



