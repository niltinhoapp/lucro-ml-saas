import { getMlEnv } from "./env";

const TIMEOUT = 20000;

/* ================= HELPERS ================= */

async function fetchTimeout(url: string, options: RequestInit) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/* ================= TOKEN ================= */

export async function exchangeMlCode({
  code,
  codeVerifier,
  redirectUri,
}: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}) {
  const env = getMlEnv();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: env.appId,
    client_secret: env.clientSecret,
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const res = await fetchTimeout(env.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await safeJson(res);

  if (!res.ok || !data?.access_token) {
    throw new Error("Erro ao obter token ML");
  }

  return data;
}

/* ================= PROFILE ================= */

export async function fetchMlMe(accessToken: string) {
  const env = getMlEnv();

  const res = await fetchTimeout(`${env.apiBaseUrl}/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await safeJson(res);

  if (!res.ok || !data?.id) {
    throw new Error("Erro ao buscar usuário ML");
  }

  return data;
}