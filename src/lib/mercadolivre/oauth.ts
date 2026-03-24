import crypto from "node:crypto";

export const ML_STATE_COOKIE = "ml_oauth_state";
export const ML_VERIFIER_COOKIE = "ml_oauth_verifier";

/* ================= CORE ================= */

export function generateOAuthState() {
  return crypto.randomBytes(16).toString("hex");
}

export function generateCodeVerifier() {
  return crypto.randomBytes(32).toString("base64url");
}

export function codeChallengeFromVerifier(verifier: string) {
  return crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
}

/* ================= VALIDATION ================= */

export function isValidState(expected: string, received: string) {
  return expected && received && expected === received;
}