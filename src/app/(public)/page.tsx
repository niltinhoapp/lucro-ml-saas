import Link from "next/link";

export default function HomePublicPage() {
  return (
    <div className="page">
      <section className="hero seller-home-hero">
        <div className="hero-inner">
          <div>
            <div className="hero-badge">
              <span className="dot" /> Inteligência de lucro para vendedores do Mercado Livre
            </div>

            <h1>
              Pare de vender no escuro e descubra <span style={{ color: "#34d399" }}>o lucro real</span> dos seus produtos.
            </h1>

            <p>
              Analise margem, monte kits campeões, compare cenários de estoque e descubra oportunidades sem usar API do ML.
            </p>

            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/dashboard" className="btn btn-primary">Entrar no painel</Link>
              <Link href="/raio-x" className="btn">Testar Raio-X grátis</Link>
              <Link href="/checkout" className="btn btn-ghost">Assinar PRO</Link>
            </div>

            <div className="kpis">
              <div className="kpi"><div className="label">Lucro</div><div className="value">Veja margem real e perdas invisíveis</div></div>
              <div className="kpi"><div className="label">Kits</div><div className="value">Aumente ticket com combinações lucrativas</div></div>
              <div className="kpi"><div className="label">Estoque</div><div className="value">Compre melhor com simulador de lote</div></div>
            </div>
          </div>

          <div className="hero-features seller-home-panel">
            <div className="feature"><div className="t">Detector de prejuízo oculto</div><div className="d">Taxas, devoluções e frete pesando na operação.</div></div>
            <div className="feature"><div className="t">Gerador de kits</div><div className="d">Ideias prontas para vender mais sem competir só por preço.</div></div>
            <div className="feature"><div className="t">Simulador de estoque</div><div className="d">Valide o lote antes de travar seu caixa.</div></div>
            <div className="alert info" style={{ marginTop: 4 }}>Feito para seller que quer resultado, não só dashboard bonito.</div>
          </div>
        </div>
      </section>

      <section className="grid-3">
        <ModuleCard title="Lucro real" desc="Descubra onde a margem está vazando antes de escalar o SKU." cta="Abrir diagnóstico" href="/dashboard/diagnostico" />
        <ModuleCard title="Kits campeões" desc="Receba kits de entrada, campeão e premium com preço sugerido." cta="Gerar kits" href="/dashboard/kits" />
        <ModuleCard title="Compra inteligente" desc="Simule lote, giro mensal e retorno sobre estoque antes de comprar." cta="Simular lote" href="/dashboard/simulador" />
      </section>

      <section className="card card-premium seller-home-cta">
        <h3>Seller forte precisa de decisão prática.</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          O Lucro ML foi estruturado para mostrar o que manter, o que corrigir e onde aumentar ticket médio.
        </p>
        <div className="market-summary-list" style={{ marginTop: 16 }}>
          <div className="alert success">Diagnóstico de lucro real por produto.</div>
          <div className="alert info">Kits sugeridos com foco em margem e valor percebido.</div>
          <div className="alert warn">Simulador de estoque para não prender caixa em SKU ruim.</div>
          <div className="alert info">Upgrade PRO em pontos estratégicos para monetizar sem forçar.</div>
        </div>
        <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/checkout" className="btn btn-primary">Assinar PRO</Link>
          <Link href="/dashboard" className="btn">Ver plataforma</Link>
        </div>
      </section>
    </div>
  );
}

function ModuleCard({ title, desc, cta, href }: { title: string; desc: string; cta: string; href: string }) {
  return (
    <div className="card card-premium">
      <h3>{title}</h3>
      <p className="muted" style={{ marginTop: 8 }}>{desc}</p>
      <div style={{ marginTop: 16 }}>
        <Link href={href} className="btn btn-ghost">{cta}</Link>
      </div>
    </div>
  );
}
