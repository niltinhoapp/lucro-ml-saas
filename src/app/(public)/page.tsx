import Link from "next/link";

export default function HomePublicPage() {
  return (
    <div className="page public-home">
      <section className="hero seller-home-hero">
        <div className="hero-inner">
          <div>
            <div className="hero-badge">
              <span className="dot" /> Inteligência de lucro para sellers do Mercado Livre
            </div>

            <h1>
              Decida melhor antes de comprar, anunciar e escalar.
            </h1>

            <p>
              O Lucro ML ajuda você a enxergar margem, risco e oportunidade com
              mais clareza para evitar compras ruins, proteger o caixa e crescer
              com mais segurança.
            </p>

            <div className="public-hero-actions">
              <Link href="/auth/register" className="btn btn-primary">
                Começar agora
              </Link>

              <Link href="/raio-x" className="btn">
                Fazer meu Raio-X grátis
              </Link>
            </div>

            <div className="kpis">
              <div className="kpi">
                <div className="label">Lucro real</div>
                <div className="value">
                  Entenda o que realmente sobra depois de taxas, frete e perdas.
                </div>
              </div>

              <div className="kpi">
                <div className="label">Compra melhor</div>
                <div className="value">
                  Avalie produtos e lotes antes de travar dinheiro em estoque ruim.
                </div>
              </div>

              <div className="kpi">
                <div className="label">Decisão clara</div>
                <div className="value">
                  Organize sua operação com menos achismo e mais leitura do negócio.
                </div>
              </div>
            </div>
          </div>

          <div className="hero-features seller-home-panel">
            <div className="feature">
              <div className="t">Descubra oportunidades</div>
              <div className="d">
                Use Radar ML e Catálogos para encontrar produtos com mais potencial.
              </div>
            </div>

            <div className="feature">
              <div className="t">Proteja sua margem</div>
              <div className="d">
                Veja onde taxas, frete e custos escondidos estão pressionando seu lucro.
              </div>
            </div>

            <div className="feature">
              <div className="t">Decida antes de investir</div>
              <div className="d">
                Simule compra, giro e retorno antes de colocar dinheiro em estoque.
              </div>
            </div>

            <div className="alert info" style={{ marginTop: 4 }}>
              Feito para seller que quer decidir com mais clareza e menos improviso.
            </div>
          </div>
        </div>
      </section>

      <section className="grid-3">
        <BenefitCard
          title="Descubra o que vale a pena"
          desc="Use Radar ML e Catálogos para separar oportunidade real de produto que só parece promissor."
        />

        <BenefitCard
          title="Valide margem antes de errar"
          desc="Entenda lucro, taxas e impacto da operação antes de insistir em produto ruim."
        />

        <BenefitCard
          title="Compre com mais segurança"
          desc="Simule lote, capital, giro e retorno para proteger caixa e evitar estoque travado."
        />
      </section>

      <section className="card card-premium seller-home-cta">
        <h3>Menos achismo. Mais clareza para comprar, anunciar e crescer.</h3>

        <p className="muted" style={{ marginTop: 8 }}>
          O Lucro ML reúne leitura de lucro, oportunidade e operação em um fluxo
          mais claro para o seller decidir melhor em cada etapa.
        </p>

        <div className="market-summary-list" style={{ marginTop: 16 }}>
          <div className="alert success">
            Descubra o lucro real de cada produto.
          </div>

          <div className="alert info">
            Identifique oportunidades com mais clareza.
          </div>

          <div className="alert warn">
            Evite compras erradas que travam caixa e margem.
          </div>
        </div>

        <div className="public-cta-actions">
          <Link href="/checkout" className="btn btn-primary">
            Ver planos
          </Link>

          <Link href="/demo" className="btn btn-ghost">
            Ver demo
          </Link>
        </div>
      </section>
    </div>
  );
}

function BenefitCard({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="card card-premium">
      <h3>{title}</h3>
      <p className="muted" style={{ marginTop: 8 }}>
        {desc}
      </p>
    </div>
  );
}