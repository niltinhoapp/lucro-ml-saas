"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/integrations/supabase/client";

type Props = {
  next?: string;
  mode?: "login" | "register";
};

function safeNext(next?: string) {
  if (!next) return "/dashboard";
  if (!next.startsWith("/")) return "/dashboard";
  if (next.startsWith("//")) return "/dashboard";
  return next;
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
      className="auth-google-svg"
    >
      <path
        fill="#EA4335"
        d="M9 7.36364V10.8545H13.8545C13.6418 11.9773 12.9818 12.9273 11.9909 13.5682L14.9182 15.8409C16.6227 14.2682 17.6045 11.9545 17.6045 9.20455C17.6045 8.56364 17.55 7.94773 17.45 7.36364H9Z"
      />
      <path
        fill="#34A853"
        d="M3.69089 10.7125L3.03044 11.218L0.691345 13.0409C2.17771 15.9864 5.22316 18 9.00044 18C11.5777 18 13.7368 17.1455 14.9186 15.8409L11.9913 13.5682C11.1868 14.1091 10.1595 14.4318 9.00044 14.4318C6.51862 14.4318 4.41407 12.7545 3.70044 10.5L3.69089 10.7125Z"
      />
      <path
        fill="#4A90E2"
        d="M0.691364 4.95909C0.0777273 6.17273 -0.000454545 7.48182 0.000000000001 8.79091C0.000000000001 10.1 0.0777273 11.4091 0.691364 12.6227C0.691364 12.6318 3.70045 10.4909 3.70045 10.4909C3.51864 9.95 3.40955 9.38182 3.40955 8.79091C3.40955 8.2 3.51864 7.63182 3.70045 7.09091L0.691364 4.95909Z"
      />
      <path
        fill="#FBBC05"
        d="M9.00044 3.15909C10.2686 3.15909 11.3913 3.59545 12.2868 4.44091L14.9822 1.74545C13.7277 0.572727 11.5777 0 9.00044 0C5.22316 0 2.17771 2.01364 0.691345 4.95909L3.70044 7.09091C4.41407 4.83636 6.51862 3.15909 9.00044 3.15909Z"
      />
    </svg>
  );
}

export default function AuthGoogleButton({
  next = "/dashboard",
  mode = "login",
}: Props) {
  const [loading, setLoading] = useState(false);

  const label =
    mode === "register" ? "Continuar com Google" : "Entrar com Google";

  async function handleGoogleLogin() {
    try {
      setLoading(true);

      const origin = window.location.origin;
      const safe = safeNext(next);
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(
        safe
      )}`;

      const { error } = await supabaseBrowser.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) {
        const errorBase = mode === "register" ? "/auth/register" : "/auth/login";

        window.location.href = `${errorBase}?next=${encodeURIComponent(
          safe
        )}&error=${encodeURIComponent(error.message)}`;
      }
    } catch (error) {
      const errorBase = mode === "register" ? "/auth/register" : "/auth/login";
      const message =
        error instanceof Error
          ? error.message
          : "Falha ao iniciar login com Google.";

      window.location.href = `${errorBase}?next=${encodeURIComponent(
        safeNext(next)
      )}&error=${encodeURIComponent(message)}`;
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className="auth-google-official-btn"
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      aria-label={label}
    >
      <span className="auth-google-official-icon">
        <GoogleIcon />
      </span>
      <span className="auth-google-official-label">
        {loading ? "Abrindo Google..." : label}
      </span>
    </button>
  );
}



