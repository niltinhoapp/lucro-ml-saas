import Link from "next/link";

export default function HomePublicPage() {
  return (
    <div className="page">
      <section className="hero seller-home-hero">
        <div className="hero-inner">
          <div>
            <div className="hero-badge">
              <span className="dot" /> Inteligência de lucro para sellers do Mercado Livre
            </div>

            <h1>
              Transforme sua operação em{" "}
              <span style={{ color: "#34d399" }}>decisões mais claras e mais lucrativas</span>.
            </h1>

            <p>
              Descubra onde sua margem está apertando, quais produtos merecem mais atenção
              e quando uma compra pode fortalecer seu caixa ou comprometer sua operação
              antes mesmo do investimento.
            </p>

            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/dashboard" className="btn btn-primary">
                Entrar na plataforma
              </Link>

              <Link href="/raio-x" className="btn">
                Fazer meu Raio-X grátis
              </Link>

              <Link href="/checkout" className="btn btn-ghost">
                Ver planos
              </Link>
            </div>

            <div className="kpis">
              <div className="kpi">
                <div className="label">Lucro real</div>
                <div className="value">Entenda o que realmente sobra depois de taxas, frete e perdas.</div>
              </div>

              <div className="kpi">
                <div className="label">Catálogos</div>
                <div className="value">Transforme fornecedores em oportunidades mais claras de compra.</div>
              </div>

              <div className="kpi">
                <div className="label">Estoque</div>
                <div className="value">Simule lotes antes de prender dinheiro em mercadoria ruim.</div>
              </div>
            </div>
          </div>

          <div className="hero-features seller-home-panel">
            <div className="feature">
              <div className="t">Diagnóstico de lucro</div>
              <div className="d">
                Descubra onde taxas, devoluções e frete estão pressionando sua margem.
              </div>
            </div>

            <div className="feature">
              <div className="t">Análise de catálogos</div>
              <div className="d">
                Envie PDF de fornecedor e identifique produtos com mais potencial de revenda.
              </div>
            </div>

            <div className="feature">
              <div className="t">Simulador de compra</div>
              <div className="d">
                Avalie lucro, giro e retorno antes de colocar dinheiro no estoque.
              </div>
            </div>

            <div className="alert info" style={{ marginTop: 4 }}>
              Feito para seller que quer decidir melhor, com mais clareza e menos achismo.
            </div>
          </div>
        </div>
      </section>

      <section className="grid-3">
        <ModuleCard
          title="Lucro real por produto"
          desc="Entenda quais produtos realmente deixam dinheiro no caixa e quais estão apenas girando sem proteger sua margem."
          cta="Abrir diagnóstico"
          href="/dashboard/diagnostico"
        />

        <ModuleCard
          title="Kits para vender melhor"
          desc="Crie combinações com mais valor percebido para fugir da guerra de preço e aumentar ticket médio."
          cta="Gerar kits"
          href="/dashboard/kits"
        />

        <ModuleCard
          title="Compra mais inteligente"
          desc="Simule lote, margem e tempo de giro antes de comprar para evitar estoque ruim e caixa travado."
          cta="Simular compra"
          href="/dashboard/operacao/simulador"
        />
      </section>

      <section className="card card-premium seller-home-cta">
        <h3>O Lucro ML foi criado para ajudar o seller a decidir melhor em cada etapa da operação.</h3>

        <p className="muted" style={{ marginTop: 8 }}>
          Em vez de depender de planilhas, catálogos soltos e números difíceis de interpretar,
          você passa a enxergar com mais clareza o que vale a pena manter, ajustar, testar ou escalar.
        </p>

        <div className="market-summary-list" style={{ marginTop: 16 }}>
          <div className="alert success">
            Descubra o lucro real de cada produto com mais clareza.
          </div>

          <div className="alert info">
            Identifique oportunidades em catálogos de fornecedores.
          </div>

          <div className="alert warn">
            Evite compras erradas que travam caixa e reduzem margem.
          </div>

          <div className="alert info">
            Escolha o plano ideal para o momento da sua operação.
          </div>
        </div>

        <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/checkout" className="btn btn-primary">
            Ver planos
          </Link>

          <Link href="/dashboard" className="btn">
            Conhecer a plataforma
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

      <div style={{ marginTop: 16 }}>
        <Link href={href} className="btn btn-ghost">
          {cta}
        </Link>
      </div>
    </div>
  );
}



