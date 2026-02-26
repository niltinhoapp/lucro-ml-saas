import Link from "next/link";

export default function HomePublicPage() {
  return (
    <div className="page">
      {/* HERO premium (usa suas classes: hero, hero-inner, kpis, feature...) */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-badge">
              <span className="dot" />
              ⚡ DRE + Fluxo de Caixa + Full vs Flex
            </div>

            <h1>
              Descubra seu <span style={{ color: "#60a5fa" }}>lucro real</span> no Mercado Livre.
            </h1>

            <p>
              Suba planilhas, gere um DRE automático, acompanhe fluxo de caixa e compare Full vs Flex.
              Tudo em um painel premium — com clareza total de taxa, frete, CMV e margem.
            </p>

            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/dashboard" className="btn btn-primary">
                Entrar no painel
              </Link>
              <Link href="/demo" className="btn">
                Ver demo
              </Link>
              <Link href="/checkout" className="btn btn-ghost">
                Assinar PRO
              </Link>
            </div>

            <div className="kpis">
              <div className="kpi">
                <div className="label">DRE automático</div>
                <div className="value">Lucro e margem reais</div>
              </div>
              <div className="kpi">
                <div className="label">Fluxo de caixa</div>
                <div className="value">Entradas e saídas por período</div>
              </div>
              <div className="kpi">
                <div className="label">Full vs Flex</div>
                <div className="value">Simule custo por unidade</div>
              </div>
            </div>
          </div>

          <div className="hero-features">
            <div className="feature">
              <div className="t">📊 DRE completo e profissional</div>
              <div className="d">
                Receita, comissões, logística, CMV, impostos e despesas — tudo organizado e comparável.
              </div>
            </div>

            <div className="feature">
              <div className="t">💰 Decisão rápida no dia a dia</div>
              <div className="d">
                Veja onde está vazando lucro e ajuste preço/compra/logística com confiança.
              </div>
            </div>

            <div className="feature">
              <div className="t">🚚 Full vs Flex sem achismo</div>
              <div className="d">
                Compare modelos com base em custo real por unidade e margem final.
              </div>
            </div>

            <div className="alert info" style={{ marginTop: 4 }}>
              💡 Dica: comece pela demo e depois migre para o PRO.
            </div>
          </div>
        </div>
      </section>

      {/* MÓDULOS */}
      <section className="grid-3">
        <ModuleCard
          title="📊 DRE Automático"
          desc="Upload → normalização → receita, taxas, logística, CMV, lucro e margem."
          cta="Abrir DRE"
          href="/dashboard/dre"
        />
        <ModuleCard
          title="💰 Fluxo de Caixa"
          desc="Entradas/saídas, saldos e histórico de relatórios para decisão rápida."
          cta="Abrir Caixa"
          href="/dashboard/fluxo-caixa"
        />
        <ModuleCard
          title="🚚 Full vs Flex"
          desc="Simule custos por unidade e descubra qual modelo dá mais lucro."
          cta="Simular"
          href="/dashboard/full-vs-flex"
        />
      </section>

      {/* PROVA / BENEFÍCIOS */}
      <section className="card card-premium">
        <h3>Clareza total: custo, taxa, frete e margem.</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          Pare de “achar” que está lucrando. Veja números reais, identifique gargalos e tome decisão de compra,
          preço e logística com confiança.
        </p>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <div className="alert success">✅ Automático: importa e organiza dados rápido</div>
          <div className="alert warn">⚠️ Insights: alertas quando a margem cair</div>
          <div className="alert info">🧾 Exportável: relatórios prontos pra apresentar</div>
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/checkout" className="btn btn-primary">
            Assinar PRO
          </Link>
          <Link href="/demo" className="btn">
            Ver demo
          </Link>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="topbar">
        <div>
          <span className="badge ok">🚀 Pronto pra parar de perder lucro?</span>
          <h2 style={{ marginTop: 10 }}>Entre no painel e veja seus números hoje.</h2>
          <p className="subtitle">
            Se você vende no ML, seu lucro muda com taxa, frete e logística. O PRO mostra a verdade.
          </p>
        </div>
        <div className="actions">
          <Link href="/dashboard" className="btn btn-primary">
            Entrar
          </Link>
          <Link href="/checkout" className="btn">
            Assinar PRO
          </Link>
        </div>
      </section>
    </div>
  );
}

function ModuleCard({
  title,
  desc,
  cta,
  href,
}: {
  title: string;
  desc: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="card card-premium">
      <h3>{title}</h3>
      <p className="muted" style={{ marginTop: 8 }}>
        {desc}
      </p>

      <div style={{ marginTop: 14 }}>
        <Link href={href} className="btn btn-ghost">
          {cta} →
        </Link>
      </div>
    </div>
  );
}