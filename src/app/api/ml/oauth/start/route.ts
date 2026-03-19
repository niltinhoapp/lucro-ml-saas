import { NextRequest, NextResponse } from "next/server";
import { getMlEnv } from "@/lib/mercadolivre/env";
import {
  codeChallengeFromVerifier,
  generateCodeVerifier,
  generateOAuthState,
  ML_STATE_COOKIE,
  ML_VERIFIER_COOKIE,
} from "@/lib/mercadolivre/oauth";
import { createServerClient } from "@/supabase/server";
import { canUseMlConnection, normalizeProfilePlan } from "@/lib/plans";

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000"
  );
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
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("[ml oauth start] auth user error", userError);
    }

    if (userError || !user) {
      return NextResponse.redirect(
        new URL("/auth/login?next=/dashboard/conta", getBaseUrl())
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[ml oauth start] profile error", profileError);
      return NextResponse.redirect(
        new URL(
          "/dashboard/conta?ml_error=profile_load_failed",
          getBaseUrl()
        )
      );
    }

    const plan = normalizeProfilePlan(profile?.plan);

    if (!canUseMlConnection(plan)) {
      return NextResponse.redirect(
        new URL("/dashboard/conta?ml_error=plan_not_allowed", getBaseUrl())
      );
    }

    const env = getMlEnv({ origin: getRequestOrigin(req) });

    const verifier = generateCodeVerifier();
    const challenge = codeChallengeFromVerifier(verifier);
    const state = generateOAuthState();

    const authUrl = new URL(env.authUrl);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", env.appId);
    authUrl.searchParams.set("redirect_uri", env.redirectUri);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", challenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    const response = NextResponse.redirect(authUrl);

    const isSecureCookie = env.redirectUri.startsWith("https://");

    response.cookies.set(ML_STATE_COOKIE, state, {
      httpOnly: true,
      secure: isSecureCookie,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });

    response.cookies.set(ML_VERIFIER_COOKIE, verifier, {
      httpOnly: true,
      secure: isSecureCookie,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });

    console.log("[ml oauth start] redirecting", {
      userId: user.id,
      plan,
      redirectUri: env.redirectUri,
      authUrl: authUrl.toString(),
      origin: getRequestOrigin(req),
      nodeEnv: process.env.NODE_ENV ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
    });

    return response;
  } catch (error) {
    console.error("[ml oauth start] fatal error", error);

    return NextResponse.redirect(
      new URL("/dashboard/conta?ml_error=oauth_start_failed", getBaseUrl())
    );
  }
}