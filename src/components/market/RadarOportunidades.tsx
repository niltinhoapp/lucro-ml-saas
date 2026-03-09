import Link from "next/link";
import { getBestsellers, getTrendItems } from "@/lib/market/mock";
import ProUpgradeButton from "@/components/pro/ProUpgradeButton";

export default function RadarOportunidades() {
  const trends = getTrendItems();
  const bestsellers = getBestsellers();

  return (
    <div className="market-page page-wrap">
      <section className="seller-hero seller-hero-radar exec-hero">
        <div className="exec-hero-top">
          <div className="exec-hero-copy">
            <span className="badge pro">Radar de oportunidades</span>

            <h1 className="exec-title">
              Encontre categorias quentes e ideias para entrar com mais inteligência
            </h1>

            <p className="exec-subtitle">
              Use tendências, competição e potencial de kits para decidir onde
              vale testar, diferenciar ou evitar entrar.
            </p>

            <div className="exec-hero-proof">
              <span className="pill good">Mais vendidos</span>
              <span className="pill">Tendências</span>
              <span className="pill">Margem</span>
              <span className="pill">Entrada inteligente</span>
            </div>
          </div>

          <div className="seller-form-card exec-form-card radar-summary-card">
            <div className="radar-summary-kicker">Leitura rápida</div>

            <div className="radar-summary-title">
              Onde o seller pode abrir espaço agora
            </div>

            <div className="market-summary-list" style={{ marginTop: 14 }}>
              <div className="alert info">
                Nichos com crescimento e competição moderada tendem a dar mais
                espaço para teste.
              </div>

              <div className="alert success">
                Produtos que aceitam kit têm maior chance de elevar ticket médio.
              </div>

              <div className="alert info">
                O ideal não é entrar onde todos estão, mas onde ainda existe
                diferenciação possível.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="diagnostic-score-card card card-premium">
        <div className="card-head">
          <div className="min-w-0">
            <h2>Leitura executiva do radar</h2>
            <p className="subtitle">
              Uma visão rápida para identificar onde vale olhar primeiro.
            </p>
          </div>

          <span className="badge ok">Radar seller</span>
        </div>

        <div className="exec-kpi-grid diagnostic-kpis">
          <div className="exec-kpi-card tone-good">
            <div className="market-kpi-label">Tendências monitoradas</div>
            <div className="exec-kpi-value">{trends.length}</div>
            <div className="exec-kpi-note">
              Nichos com potencial para observação.
            </div>
          </div>

          <div className="exec-kpi-card tone-info">
            <div className="market-kpi-label">Categorias em destaque</div>
            <div className="exec-kpi-value">{bestsellers.length}</div>
            <div className="exec-kpi-note">
              Grupos com maior atenção de mercado.
            </div>
          </div>

          <div className="exec-kpi-card">
            <div className="market-kpi-label">Foco recomendado</div>
            <div className="exec-kpi-value">Kits</div>
            <div className="exec-kpi-note">
              Melhor forma de entrar com diferenciação.
            </div>
          </div>
        </div>
      </section>

      <section className="market-grid-2">
        <div className="card card-premium exec-section-card">
          <div className="card-head">
            <div className="min-w-0">
              <h2>Tendências</h2>
              <p className="subtitle">
                Onde o seller pode abrir espaço com mais inteligência.
              </p>
            </div>

            <span className="badge ok">Atualização</span>
          </div>

          <div className="market-trend-list">
            {trends.map((item) => (
              <div key={item.term} className="market-trend-item radar-trend-item">
                <div className="min-w-0">
                  <div className="market-trend-title">{item.term}</div>
                  <div className="muted">
                    {item.category} • competição {item.competition}
                  </div>
                </div>

                <div className="market-trend-meta">
                  <span className="badge pro">{item.growth}</span>
                  <span className="pill">margem {item.marginPotential}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-premium exec-section-card">
          <div className="card-head">
            <div className="min-w-0">
              <h2>Mais vendidos</h2>
              <p className="subtitle">
                Categorias quentes para observar antes de montar a oferta.
              </p>
            </div>

            <span className="badge pro">Entrada</span>
          </div>

          <div className="market-bestseller-grid radar-bestseller-grid">
            {bestsellers.map((group) => (
              <div key={group.category} className="market-bestseller-card radar-bestseller-card">
                <div className="market-bestseller-title">{group.category}</div>

                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <Link
                  href="/dashboard/kits"
                  className="btn btn-ghost"
                  style={{ marginTop: 14 }}
                >
                  Gerar kit
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="market-grid-2">
        <div className="card card-premium exec-section-card">
          <div className="card-head">
            <div className="min-w-0">
              <h2>Como usar esse radar</h2>
              <p className="subtitle">
                O radar fica mais forte quando vira ação prática.
              </p>
            </div>
          </div>

          <div className="market-summary-list">
            <div className="alert info">
              Priorize categorias com crescimento e competição administrável.
            </div>

            <div className="alert success">
              Procure produtos que permitam kit ou bundle para fugir da guerra de preço.
            </div>

            <div className="alert info">
              Valide com simulador e diagnóstico antes de comprar estoque maior.
            </div>
          </div>
        </div>

        <ProUpgradeButton
          title="Assine o PRO para cruzar radar com kits e lucro real"
          subtitle="Veja oportunidade, monte bundle e valide a margem da operação no mesmo fluxo."
        />
      </section>
    </div>
  );
}