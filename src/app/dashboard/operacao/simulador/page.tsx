import { redirect } from "next/navigation";
import { Boxes, Calculator, ShieldCheck } from "lucide-react";
import { createServerClient } from "@/integrations/supabase/server";
import SimuladorEstoqueClient from "@/features/operacao/simulador/components/SimuladorEstoqueClient";

export default async function SimuladorPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard/operacao/simulador");
  }

  return (
    <div className="lm-sim-page">
      <section className="lm-sim-hero">
        <div className="lm-sim-hero__content">
          <span className="lm-sim-chip">Operação • Simulador</span>

          <h1 className="lm-sim-title">Simulador de compra e estoque</h1>

          <p className="lm-sim-subtitle">
            Simule lote, risco, margem e tempo de giro antes de travar dinheiro
            em mercadoria.
          </p>
        </div>
      </section>

      <section className="lm-sim-grid">
        <article className="lm-sim-card">
          <div className="lm-sim-card__icon">
            <Boxes size={20} />
          </div>

          <div className="lm-sim-card__copy">
            <h2>Lote</h2>
            <p>
              Veja o impacto da quantidade comprada no caixa e no potencial de
              giro.
            </p>
          </div>
        </article>

        <article className="lm-sim-card">
          <div className="lm-sim-card__icon">
            <Calculator size={20} />
          </div>

          <div className="lm-sim-card__copy">
            <h2>Margem</h2>
            <p>
              Simule custos e retorno esperado antes de assumir o compromisso.
            </p>
          </div>
        </article>

        <article className="lm-sim-card">
          <div className="lm-sim-card__icon">
            <ShieldCheck size={20} />
          </div>

          <div className="lm-sim-card__copy">
            <h2>Risco</h2>
            <p>
              Entenda o peso da decisão para evitar compra ruim e estoque
              parado.
            </p>
          </div>
        </article>
      </section>

      <section className="lm-sim-panel">
        <SimuladorEstoqueClient />
      </section>
    </div>
  );
}