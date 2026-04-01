import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/integrations/supabase/server";
import { markStrategyAsRead } from "@/features/strategies/server/mutations";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Strategy id is required." },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await markStrategyAsRead(user.id, id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/strategies/[id]/read error:", error);
    return NextResponse.json(
      { error: "Falha ao marcar estratégia como lida." },
      { status: 500 }
    );
  }
}


