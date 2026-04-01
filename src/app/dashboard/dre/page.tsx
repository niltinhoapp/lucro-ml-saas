import { redirect } from "next/navigation";
import { createServerClient } from "@/integrations/supabase/server";
import { getEntitlements } from "@/integrations/supabase/entitlements";
import DrePageClient from "./DrePageClient";
import PlanGate from "@/components/paywall/PlanGate";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      id
        ? `/auth/login?next=/dashboard/dre?id=${id}`
        : "/auth/login?next=/dashboard/historico"
    );
  }

  const ent = await getEntitlements(supabase, user.id);

  if (ent.plan === "free_trial" || ent.plan === "free_blocked") {
    return (
      <PlanGate
        requiredPlan="pro"
        title="Lucro real"
        description="Veja o resultado da operação com mais clareza."
        bullets={[
          "Acompanhe receita, custos e lucro.",
          "Veja onde sua margem está apertando.",
        ]}
      >
        <div />
      </PlanGate>
    );
  }

  if (!id || id === "undefined") {
    redirect("/dashboard/historico");
  }

  return <DrePageClient id={id} />;
}



