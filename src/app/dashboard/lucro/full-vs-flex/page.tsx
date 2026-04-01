import { redirect } from "next/navigation";
import { Truck, Zap, Scale } from "lucide-react";
import { createServerClient } from "@/integrations/supabase/server";
import FullVsFlexAI from "@/features/lucro/full-vs-flex/components/FullVsFlexAI";

export default async function FullVsFlexPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard/lucro/full-vs-flex");
  }

  return (
    <div className="lm-page-section">
      <section className="lm-hero-surface lm-panel">
        <div className="lm-page-header">
          <div>
            <p className="lm-page-eyebrow">Lucro • Full vs Flex</p>
            <h1 className="lm-page-title">Full vs Flex</h1>
            <p className="lm-page-subtitle">
              Compare cenários logísticos para entender impacto em margem,
              giro, competitividade e operação.
            </p>
          </div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "16px",
        }}
      >
        <article className="lm-panel">
          <Truck size={20} />
          <h2>Full</h2>
          <p>
            Avalie ganho de conveniência, relevância e impacto nas taxas.
          </p>
        </article>

        <article className="lm-panel">
          <Zap size={20} />
          <h2>Flex</h2>
          <p>
            Entenda quando a velocidade local pode ser uma vantagem real.
          </p>
        </article>

        <article className="lm-panel">
          <Scale size={20} />
          <h2>Comparação</h2>
          <p>
            Compare custo, operação e efeito na oferta antes de decidir.
          </p>
        </article>
      </section>

      <section className="lm-panel">
        <FullVsFlexAI
          receitaTotal={1000}
          custoProdutos={500}
          fullTaxaDefault={16}
          flexTaxaDefault={16}
          fullLogisticaDefault={120}
          flexLogisticaDefault={80}
        />
      </section>
    </div>
  );
}