import { redirect } from "next/navigation";
import { createServerClient } from "@/integrations/supabase/server";
import { StrategiesShell } from "@/features/strategies/components/StrategiesShell";

export default async function ProdutosEstrategiasPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard/produtos/estrategias");
  }

  return (
    <div className="lm-page-section">
      <div className="lm-page-header">
        <div>
          <p className="lm-page-eyebrow">Produtos • Estratégias</p>
          <h1 className="lm-page-title">Central de estratégias</h1>
          <p className="lm-page-subtitle">
            Transforme leitura de mercado em ação prática, com recomendações
            alinhadas ao comportamento do seller e às oportunidades do Radar ML.
          </p>
        </div>
      </div>

      <StrategiesShell />
    </div>
  );
}


