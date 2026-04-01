// src/app/page.tsx
import Link from "next/link";
import ThemeToggle from "@/ThemeToggle";

export default function HomePage() {
  return (
    <main className="page-wrap vitrine-page">
      {/* HERO */}
      <section className="topbar vitrine-hero">
        <div className="vitrine-hero-left">
          <span className="badge pro">Lucro ML • PRO</span>

          <h1 className="vitrine-title">
            O painel premium para vendedores  no Mercado Livre
          </h1>

          <p className="subtitle vitrine-subtitle">
            DRE automático + simulações inteligentes para você precificar com
            precisão, reduzir perdas e aumentar margens. Exclusivo para assinantes PRO.
          </p>

          <div className="vitrine-points">
            <span className="vitrine-point">✔ Receita, taxas, logística e CMV</span>
            <span className="vitrine-point">✔ Alertas de risco e margem apertada</span>
            <span className="vitrine-point">✔ Full vs Flex com decisão clara</span>
          </div>
        </div>

        <div className="vitrine-hero-right">
          {/* Grupo premium */}
          <div className="btn-group">
            <ThemeToggle />
            <Link className="btn btn-ghost" href="/demo">
              Testar Demo
            </Link>
            <Link className="btn btn-outline" href="/auth/login?next=%2Fdashboard">
              Entrar
            </Link>
            <Link className="btn btn-outline" href="/dashboard">
              Painel
            </Link>
          </div>

          {/* CTA principal */}
          <Link className="btn-pro" href="/pricing">
            Desbloquear PRO agora
          </Link>

          <div className="vitrine-note">
            Assinatura flexível • Cancelamento a qualquer momento • Pagamento seguro 🔒
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid-3 vitrine-kpis">
        <div className="summary-card">
          <p>Receita do período</p>
          <div className="value">R$ 18.420,30</div>
          <div className="muted kpi-sub">+12% vs período anterior 📈</div>
        </div>

        <div className="summary-card">
          <p>Custos e taxas</p>
          <div className="value">R$ 9.106,10</div>
          <div className="muted kpi-sub">Comissão, frete e impostos 💳</div>
        </div>

        <div className="summary-card">
          <p>Lucro estimado</p>
          <div className="value">R$ 5.980,40</div>
          <div className="muted kpi-sub">
            Margem atual: <b>32,4%</b> ✅
          </div>
        </div>
      </section>

      {/* Módulos premium */}
      <section className="vitrine-panels">
        <div className="card vitrine-panel">
          <div className="card-head">
            <div className="head-copy">
              <h2>📊 DRE automático</h2>
              <p>Importe sua planilha e veja o resultado real das vendas em segundos.</p>
            </div>

            <div className="actions">
              <Link className="btn btn-primary" href="/dashboard/historico">
                Ver histórico
              </Link>
              <Link className="btn btn-success" href="/pricing">
                Começar no PRO
              </Link>
            </div>
          </div>

          <div className="card-body">
            <ul className="feature-list">
              <li>✔ Visão completa: receita, custos, taxas e logística</li>
              <li>✔ Lucro e margem calculados automaticamente</li>
              <li>✔ Alertas de margem apertada</li>
              <li>✔ Histórico organizado para comparar períodos</li>
            </ul>

            <div className="vitrine-cta-row">
              <Link className="btn btn-ghost" href="/auth/login?next=%2Fdashboard">
                Entrar e importar planilha
              </Link>
              <span className="muted vitrine-cta-note">
                Ideal para quem vende diariamente e precisa de clareza no lucro.
              </span>
            </div>
          </div>
        </div>

        <div className="card vitrine-panel">
          <div className="card-head">
            <div className="head-copy">
              <h2>🚚 Full vs Flex</h2>
              <p>Simule por unidade e descubra qual logística deixa mais lucro no seu bolso.</p>
            </div>

            <div className="actions">
              <Link className="btn btn-primary" href="/dashboard/lucro/full-vs-flex">
                Simular agora
              </Link>
              <Link className="btn btn-success" href="/pricing">
                Desbloquear PRO
              </Link>
            </div>
          </div>

          <div className="card-body">
            <ul className="feature-list">
              <li>✔ Comparação automática de lucro e margem</li>
              <li>✔ Ajuste de taxa, logística e custos extras</li>
              <li>✔ Recomendação clara do melhor cenário</li>
            </ul>

            <div className="vitrine-cta-row">
              <Link className="btn btn-ghost" href="/auth/login?next=%2Fdashboard">
                Entrar e simular
              </Link>
              <span className="muted vitrine-cta-note">
                Pare de “chutar”: decida com números.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer premium */}
      <div className="small vitrine-footer">
        Lucro ML • PRO — SaaS premium para vendedores profissionais no Mercado Livre
      </div>
    </main>
  );
}



