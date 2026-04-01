import CalculadoraFullFlex from "./components/CalculadoraFullFlex";

export default function FullVsFlexPage() {
  return (
    <div className="page-wrap fvf-page">
      <section className="ui-card fvf-hero2">
        <div className="fvf-hero2-inner">
          <div className="fvf-hero2-left">
            <div className="fvf-hero2-badge">
              <span className="fvf-hero2-dot" aria-hidden />
              Full vs Flex
            </div>

            <h1 className="fvf-hero2-title">Compare Full e Flex</h1>

            <p className="fvf-hero2-sub">
              Veja qual modelo protege melhor sua margem.
            </p>

            <div className="fvf-hero2-kpis" role="list">
              <div className="ui-kpi info" role="listitem">
                <div className="ui-kpi-label">Comparação</div>
                <div className="ui-kpi-value">Full x Flex</div>
              </div>

              <div className="ui-kpi" role="listitem">
                <div className="ui-kpi-label">Leitura</div>
                <div className="ui-kpi-value">Lucro e margem</div>
              </div>

              <div className="ui-kpi good" role="listitem">
                <div className="ui-kpi-label">Objetivo</div>
                <div className="ui-kpi-value">Escolher melhor logística</div>
              </div>
            </div>
          </div>

          <aside className="fvf-hero2-right" aria-label="Resumo da tela">
            <div className="fvf-feature">
              <div className="fvf-feature-title">Full</div>
              <div className="fvf-feature-desc">
                Compare custo e margem.
              </div>
            </div>

            <div className="fvf-feature">
              <div className="fvf-feature-title">Flex</div>
              <div className="fvf-feature-desc">
                Veja o impacto do frete.
              </div>
            </div>

            <div className="fvf-feature">
              <div className="fvf-feature-title">Resultado</div>
              <div className="fvf-feature-desc">
                Descubra qual modelo vale mais.
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="fvf-body">
        <CalculadoraFullFlex />
      </section>
    </div>
  );
}