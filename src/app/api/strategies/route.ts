import { NextResponse } from "next/server";
import { createServerClient } from "@/integrations/supabase/server";
import {
  getRecommendationsForUser,
  getStrategiesForUser,
} from "@/features/strategies/server/queries";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [strategies, recommendations] = await Promise.all([
      getStrategiesForUser(user.id),
      getRecommendationsForUser(user.id),
    ]);

    return NextResponse.json({
      strategies,
      recommendations,
    });
  } catch (error) {
    console.error("GET /api/strategies error:", error);
    return NextResponse.json(
      { error: "Falha ao carregar estratégias." },
      { status: 500 }
    );
  }
}



