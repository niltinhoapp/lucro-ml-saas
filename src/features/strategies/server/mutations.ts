import { revalidateTag } from "next/cache";
import { createServerClient } from "@/integrations/supabase/server";

export async function markStrategyAsRead(userId: string, strategyId: string) {
  const supabase = await createServerClient();

  const { data: existing, error: existingError } = await supabase
    .from("user_strategy_reads")
    .select("id")
    .eq("user_id", userId)
    .eq("strategy_id", strategyId)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("user_strategy_reads")
      .update({
        read_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) {
      throw updateError;
    }
  } else {
    const { error: insertError } = await supabase
      .from("user_strategy_reads")
      .insert({
        user_id: userId,
        strategy_id: strategyId,
        read_at: new Date().toISOString(),
      });

    if (insertError) {
      throw insertError;
    }
  }

  revalidateTag("strategies", "max");
}



