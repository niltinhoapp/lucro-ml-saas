import { redirect } from "next/navigation";
import { createServerClient } from "@/supabase/server";
import { getEntitlements } from "@/supabase/entitlements";
import PlanGate from "@/components/paywall/PlanGate";
import MarketIntelligenceClient from "@/components/market/MarketIntelligenceClient";

export default async function Page() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard/operacao/inteligencia");
  }

  const ent = await getEntitlements(supabase, user.id);

  if (!(ent.isPro)) {
    return (
      <PlanGate
        requiredPlan="pro"
        title="Inteligência de mercado para decidir melhor"
        description="No PRO, você analisa cenário, demanda, concorrência e potencial de produto com mais clareza antes de comprar, testar ou escalar uma oportunidade."
        bullets={['Entenda risco, demanda e espaço de mercado com mais contexto.', 'Tome decisões de produto com mais segurança e menos achismo.']}
      />
    );
  }

  return <MarketIntelligenceClient />;
}

