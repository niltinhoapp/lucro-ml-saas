import { createServerClient } from "@/integrations/supabase/server";

export type UserPlan = "free_trial" | "plus" | "pro";

export async function getUserPlan(): Promise<UserPlan> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // usuário não logado
  if (!user) {
    return "free_trial";
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Erro ao buscar plano:", error);
    return "free_trial";
  }

  return (data?.plan as UserPlan) ?? "free_trial";
}
