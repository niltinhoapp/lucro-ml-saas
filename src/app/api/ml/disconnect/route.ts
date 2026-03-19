import { NextResponse } from "next/server";
import { createServerClient } from "@/supabase/server";

export async function POST(req: Request) {
  const supabase = await createServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const redirectUrl = new URL("/dashboard/conta", req.url);

  if (userError || !user) {
    redirectUrl.searchParams.set("ml", "login_required");
    return NextResponse.redirect(redirectUrl);
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("ml_connections")
    .update({
      is_active: false,
      access_token: null,
      refresh_token: null,
      expires_at: null,
      updated_at: now,
    })
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (error) {
    console.error("[ml disconnect] update error", {
      userId: user.id,
      error: error.message,
    });

    redirectUrl.searchParams.set("ml", "disconnect_error");
    return NextResponse.redirect(redirectUrl);
  }

  redirectUrl.searchParams.set("ml", "disconnected");
  return NextResponse.redirect(redirectUrl);
}
