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
    <div className="lm-page-section">
      <section className="lm-hero-surface lm-panel">
        <div className="lm-page-header">
          <div>
            <p className="lm-page-eyebrow">Operação • Simulador</p>
            <h1 className="lm-page-title">Simulador de compra e estoque</h1>
            <p className="lm-page-subtitle">
              Simule lote, risco, margem e tempo de giro antes de travar dinheiro
              em mercadoria.
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
          <Boxes size={20} />
          <h2>Lote</h2>
          <p>
            Veja o impacto da quantidade comprada no caixa e no potencial de giro.
          </p>
        </article>

        <article className="lm-panel">
          <Calculator size={20} />
          <h2>Margem</h2>
          <p>
            Simule custos e retorno esperado antes de assumir o compromisso.
          </p>
        </article>

        <article className="lm-panel">
          <ShieldCheck size={20} />
          <h2>Risco</h2>
          <p>
            Entenda o peso da decisão para evitar compra ruim e estoque parado.
          </p>
        </article>
      </section>

      <section className="lm-panel">
        <SimuladorEstoqueClient />
      </section>
    </div>
  );
}