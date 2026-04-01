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
    <div className="lm-page-section">
      <section className="lm-hero-surface lm-panel">
        <div className="lm-page-header">
          <div>
            <p className="lm-page-eyebrow">Lucro • Fluxo de Caixa</p>
            <h1 className="lm-page-title">Fluxo de caixa</h1>
            <p className="lm-page-subtitle">
              Entenda entradas, saídas e o fôlego financeiro da operação para
              decidir compra, giro e reinvestimento com mais segurança.
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
          <Wallet size={20} />
          <h2>Visão de caixa</h2>
          <p>
            Consolide entradas e saídas para enxergar o saldo operacional com
            clareza.
          </p>
        </article>

        <article className="lm-panel">
          <ArrowRightLeft size={20} />
          <h2>Movimento real</h2>
          <p>
            Compare períodos e identifique onde o caixa aperta ou ganha fôlego.
          </p>
        </article>

        <article className="lm-panel">
          <TrendingUp size={20} />
          <h2>Próximo passo</h2>
          <p>
            Use esta leitura para decidir compra, estoque e ritmo de expansão.
          </p>
        </article>
      </section>

      <section className="lm-panel">
        <h2>Em evolução</h2>
        <p>
          Esta página já está ativa na V2.1 como base do módulo. O próximo passo
          é ligar os dados reais de caixa e relatórios consolidados.
        </p>
      </section>
    </div>
  );
}