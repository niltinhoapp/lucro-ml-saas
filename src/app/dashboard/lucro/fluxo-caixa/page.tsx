import { redirect } from "next/navigation";
import { Wallet, ArrowRightLeft, TrendingUp } from "lucide-react";
import { createServerClient } from "@/integrations/supabase/server";

export default async function FluxoCaixaPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard/lucro/fluxo-caixa");
  }

  return (
    <div className="lm-cashflow-page">
      <section className="lm-cashflow-hero">
        <div className="lm-cashflow-hero__content">
          <span className="lm-cashflow-chip">Lucro • Fluxo de Caixa</span>

          <h1 className="lm-cashflow-title">Fluxo de caixa</h1>

          <p className="lm-cashflow-subtitle">
            Entenda entradas, saídas e o fôlego financeiro da operação para
            decidir compra, giro e reinvestimento com mais segurança.
          </p>
        </div>
      </section>

      <section className="lm-cashflow-grid">
        <article className="lm-cashflow-card">
          <div className="lm-cashflow-card__icon">
            <Wallet size={20} />
          </div>

          <div className="lm-cashflow-card__copy">
            <h2>Visão de caixa</h2>
            <p>
              Consolide entradas e saídas para enxergar o saldo operacional com
              clareza.
            </p>
          </div>
        </article>

        <article className="lm-cashflow-card">
          <div className="lm-cashflow-card__icon">
            <ArrowRightLeft size={20} />
          </div>

          <div className="lm-cashflow-card__copy">
            <h2>Movimento real</h2>
            <p>
              Compare períodos e identifique onde o caixa aperta ou ganha
              fôlego.
            </p>
          </div>
        </article>

        <article className="lm-cashflow-card">
          <div className="lm-cashflow-card__icon">
            <TrendingUp size={20} />
          </div>

          <div className="lm-cashflow-card__copy">
            <h2>Próximo passo</h2>
            <p>
              Use esta leitura para decidir compra, estoque e ritmo de
              expansão.
            </p>
          </div>
        </article>
      </section>

     
    </div>
  );
}
