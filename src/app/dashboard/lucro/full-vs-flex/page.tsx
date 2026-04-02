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
    <div className="lm-fvf-page">
      <section className="lm-fvf-hero">
        <div className="lm-fvf-hero__content">
          <span className="lm-fvf-chip">Lucro • Full vs Flex</span>

          <h1 className="lm-fvf-title">Full vs Flex</h1>

          <p className="lm-fvf-subtitle">
            Compare cenários logísticos para entender impacto em margem,
            giro, competitividade e operação.
          </p>
        </div>
      </section>

      <section className="lm-fvf-grid">
        <article className="lm-fvf-card">
          <div className="lm-fvf-card__icon">
            <Truck size={20} />
          </div>

          <div className="lm-fvf-card__copy">
            <h2>Full</h2>
            <p>
              Avalie ganho de conveniência, relevância e impacto nas taxas.
            </p>
          </div>
        </article>

        <article className="lm-fvf-card">
          <div className="lm-fvf-card__icon">
            <Zap size={20} />
          </div>

          <div className="lm-fvf-card__copy">
            <h2>Flex</h2>
            <p>
              Entenda quando a velocidade local pode ser uma vantagem real.
            </p>
          </div>
        </article>

        <article className="lm-fvf-card">
          <div className="lm-fvf-card__icon">
            <Scale size={20} />
          </div>

          <div className="lm-fvf-card__copy">
            <h2>Comparação</h2>
            <p>
              Compare custo, operação e efeito na oferta antes de decidir.
            </p>
          </div>
        </article>
      </section>

      <section className="lm-fvf-panel">
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