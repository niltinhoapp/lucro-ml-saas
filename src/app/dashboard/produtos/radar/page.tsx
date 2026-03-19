import { redirect } from "next/navigation";
import { createServerClient } from "@/supabase/server";
import { getEntitlements } from "@/supabase/entitlements";
import PlanGate from "@/components/paywall/PlanGate";
import RadarOportunidades from "@/components/market/RadarOportunidades";

export default async function Page() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard/produtos/radar");
  }

  const ent = await getEntitlements(supabase, user.id);

  if (!(ent.isPlus)) {
    return (
      <PlanGate
        requiredPlan="plus"
        title="Radar de oportunidades"
        description="Pesquise um produto e veja rapidamente se vale a pena vender no Mercado Livre."
        bullets={['Descubra produtos com boa procura.', 'Veja o nível de concorrência antes de investir em estoque.', 'Entenda o preço médio praticado no Mercado Livre.']}
      />
    );
  }

  return <RadarOportunidades />;
}

