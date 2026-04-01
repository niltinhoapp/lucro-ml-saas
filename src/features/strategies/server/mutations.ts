import { revalidateTag } from "next/cache";
import { createServerClient } from "@/integrations/supabase/server";

export async function markStrategyAsRead(userId: string, strategyId: string) {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("strategy_reads")
    .upsert(
      {
        user_id: userId,
        strategy_id: strategyId,
        read_at: new Date().toISOString(),
      },
      {
        onConflict: "strategy_id,user_id",
      }
    );

  if (error) {
    throw error;
  }

  revalidateTag("strategies", "max");
}

