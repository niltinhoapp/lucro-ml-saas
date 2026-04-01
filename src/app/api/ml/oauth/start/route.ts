import { NextResponse } from "next/server";
import { getMlEnv } from "@/lib/mercadolivre/env";
import {
  codeChallengeFromVerifier,
  generateCodeVerifier,
  generateOAuthState,
  ML_STATE_COOKIE,
  ML_VERIFIER_COOKIE,
} from "@/lib/mercadolivre/oauth";
import { createServerClient } from "@/integrations/supabase/server";
import { canUseMlConnection, normalizeProfilePlan } from "@/lib/plans";

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000"
  );
}

export async function GET() {
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
        new URL("/dashboard/conta?ml=profile_error", getBaseUrl())
      );
    }

    const currentPlan = normalizeProfilePlan(profile?.plan);

    if (!canUseMlConnection(currentPlan)) {
      return NextResponse.redirect(
        new URL("/checkout?plan=plus&feature=ml", getBaseUrl())
      );
    }

    const env = getMlEnv();

    console.log("[ml oauth start] baseUrl", getBaseUrl());
    console.log("[ml oauth start] redirectUri", env.redirectUri);
    console.log("[ml oauth start] appId", env.appId);

    const state = generateOAuthState();
    const verifier = generateCodeVerifier();
    const challenge = codeChallengeFromVerifier(verifier);

    const authUrl = new URL(env.authUrl);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", env.appId);
    authUrl.searchParams.set("redirect_uri", env.redirectUri);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", challenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    console.log("[ml oauth start] authUrl", authUrl.toString());

    const response = NextResponse.redirect(authUrl.toString());

    const cookieOptions = {
      httpOnly: true,
      secure: env.redirectUri.startsWith("https://"),
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 10,
    };

    response.cookies.set(ML_STATE_COOKIE, state, cookieOptions);
    response.cookies.set(ML_VERIFIER_COOKIE, verifier, cookieOptions);

    return response;
  } catch (error) {
    console.error("[ml oauth start] fatal error", error);

    return NextResponse.json(
      {
        ok: false,
        route: "ml_oauth_start",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}




