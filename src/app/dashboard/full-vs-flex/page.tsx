import CalculadoraFullFlex from "./components/CalculadoraFullFlex";

export default function FullVsFlexPage() {
  return (
    <div className="page-wrap fvf-page">
      {/* HERO Stripe-like */}
      <section className="ui-card fvf-hero2">
        <div className="fvf-hero2-inner">
          {/* Left */}
          <div className="fvf-hero2-left">
            <div className="fvf-hero2-badge">
              <span className="fvf-hero2-dot" aria-hidden />
              Simulador PRO (Full vs Flex)
            </div>

            <h1 className="fvf-hero2-title">Calculadora Inteligente — Full vs Flex</h1>

            <p className="fvf-hero2-sub">
              Compare <b>lucro por unidade</b>, <b>margem</b> e receba a{" "}
              <b>recomendação automática</b> do melhor modelo para sua operação no Mercado Livre.
            </p>

            <div className="fvf-hero2-kpis" role="list">
              <div className="ui-kpi info" role="listitem">
                <div className="ui-kpi-label">Resultado</div>
                <div className="ui-kpi-value">Comparação automática</div>
              </div>
              <div className="ui-kpi" role="listitem">
                <div className="ui-kpi-label">Visão</div>
                <div className="ui-kpi-value">Lucro + Margem</div>
              </div>
              <div className="ui-kpi good" role="listitem">
                <div className="ui-kpi-label">Modo</div>
                <div className="ui-kpi-value">PRO (Light + Dark)</div>
              </div>
            </div>
          </div>

          {/* Right */}
          <aside className="fvf-hero2-right" aria-label="O que esta calculadora faz">
            <div className="fvf-feature">
              <div className="fvf-feature-title">📦 Full</div>
              <div className="fvf-feature-desc">Inclui custo extra do Full por unidade.</div>
            </div>

            <div className="fvf-feature">
              <div className="fvf-feature-title">🚚 Flex</div>
              <div className="fvf-feature-desc">Considera seu frete médio por unidade.</div>
            </div>

            <div className="fvf-feature">
              <div className="fvf-feature-title">🎯 Recomendação</div>
              <div className="fvf-feature-desc">Sugere automaticamente o mais lucrativo.</div>
            </div>
          </aside>
        </div>
      </section>

      {/* Body */}
      <section className="fvf-body">
        <CalculadoraFullFlex />
      </section>
    </div>
  );
}