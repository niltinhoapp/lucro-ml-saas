import Link from "next/link";
import ThemeToggle from "@/ThemeToggle";

export default function DemoPage() {
  return (
    <main className="page-wrap vitrine-page">
      <section className="topbar vitrine-hero">
        <div className="vitrine-hero-left">
          <span className="badge pro">Lucro ML • Demo</span>

          <h1 className="vitrine-title">
            Veja como o seller pode decidir com mais clareza antes de comprar e anunciar
          </h1>

          <p className="subtitle vitrine-subtitle">
            A demo mostra como o Lucro ML organiza leitura de margem, risco e
            oportunidade para ajudar o seller a evitar achismo e agir com mais segurança.
          </p>

          <div className="vitrine-points">
            <span className="vitrine-point">✔ Leitura de lucro real</span>
            <span className="vitrine-point">✔ Simulação antes da compra</span>
            <span className="vitrine-point">✔ Decisão mais clara na operação</span>
          </div>
        </div>

        <div className="vitrine-hero-right">
          <div className="btn-group">
            <ThemeToggle />
            <Link className="btn btn-ghost" href="/raio-x">
              Raio-X grátis
            </Link>
            <Link className="btn btn-outline" href="/auth/login?next=%2Fdashboard">
              Entrar
            </Link>
          </div>

          <Link className="btn-pro" href="/checkout">
            Ver planos
          </Link>

          <div className="vitrine-note">
            Estrutura pensada para seller que quer menos improviso e mais clareza.
          </div>
        </div>
      </section>

      <section className="grid-3 vitrine-kpis">
        <div className="summary-card">
          <p>Receita do período</p>
          <div className="value">R$ 18.420,30</div>
          <div className="muted kpi-sub">Leitura consolidada da operação</div>
        </div>

        <div className="summary-card">
          <p>Custos e taxas</p>
          <div className="value">R$ 9.106,10</div>
          <div className="muted kpi-sub">Comissão, frete e impostos</div>
        </div>

        <div className="summary-card">
          <p>Lucro estimado</p>
          <div className="value">R$ 5.980,40</div>
          <div className="muted kpi-sub">Resultado mais claro para decidir</div>
        </div>
      </section>

      <section className="card card-premium">
        <h3>O foco não é mostrar módulo. É mostrar decisão.</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          A proposta do Lucro ML é ajudar o seller a entender o que proteger,
          o que ajustar e o que merece investimento.
        </p>

        <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn btn-primary" href="/auth/register">
            Começar agora
          </Link>

          <Link className="btn btn-ghost" href="/checkout">
            Comparar planos
          </Link>
        </div>
      </section>

      <div className="small vitrine-footer">
        Lucro ML — inteligência de lucro para sellers do Mercado Livre
      </div>
    </main>
  );
}