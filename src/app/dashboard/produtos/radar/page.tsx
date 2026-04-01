import { redirect } from "next/navigation";
import { createServerClient } from "@/integrations/supabase/server";
import RadarOportunidades from "@/features/produtos/radar/components/RadarOportunidades";

export default async function DashboardProdutosRadarPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard/produtos/radar");
  }

  return (
    <div className="lm-page-section">
      <div className="lm-page-header">
        <div>
          <p className="lm-page-eyebrow">Produtos • Radar ML</p>
          <h1 className="lm-page-title">Radar de oportunidades</h1>
          <p className="lm-page-subtitle">
            Descubra produtos com melhor equilíbrio entre demanda,
            concorrência e potencial de margem.
          </p>
        </div>
      </div>

      <RadarOportunidades />
    </div>
  );
}
