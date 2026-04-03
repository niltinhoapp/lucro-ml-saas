// /app/api/auth/entitlements/route.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@/integrations/supabase/server";
import { getEntitlements } from "@/integrations/supabase/entitlements";

export async function GET() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ent = await getEntitlements(supabase, user.id);

  return NextResponse.json(ent);
}