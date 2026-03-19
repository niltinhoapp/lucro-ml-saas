import { redirect } from "next/navigation";
import { createServerClient } from "@/supabase/server";
import { getEntitlements } from "@/supabase/entitlements";
import PlanGate from "@/components/paywall/PlanGate";
import SimuladorEstoqueClient from "@/components/market/SimuladorEstoqueClient";

export default async function Page() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard/operacao/simulador");
  }

  const ent = await getEntitlements(supabase, user.id);

  if (!(ent.isPro)) {
    return (
      <PlanGate
        requiredPlan="pro"
        title="Simulador de lucro para compra de estoque"
        description="Antes de investir em um lote, veja quanto dinheiro será imobilizado, qual lucro pode voltar para o caixa e em quanto tempo esse estoque tende a girar."
        bullets={['Evite comprar produtos com margem ruim.', 'Veja lucro estimado, retorno e tempo de giro antes de investir.']}
      />
    );
  }

  return <SimuladorEstoqueClient />;
}

