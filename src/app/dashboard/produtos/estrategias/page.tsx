import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createServerClient } from "@/integrations/supabase/server";
import { StrategiesShell } from "@/features/strategies/components/StrategiesShell";

export default async function StrategiesPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard/produtos/estrategias");
  }

  return (
    <Suspense fallback={<div className="lm-strat-loading">Carregando estratégias...</div>}>
      <StrategiesShell />
    </Suspense>
  );
}
