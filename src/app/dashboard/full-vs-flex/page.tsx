import CalculadoraFullFlex from "./components/CalculadoraFullFlex";

export default function FullVsFlexPage() {
  return (
    <div className="page-wrap">
      <section className="hero">
        <div className="hero-inner" style={{ gridTemplateColumns: "1.2fr .8fr" }}>
          <div>
            <div className="hero-badge">
              <span className="dot" />
              Simulador PRO (Full vs Flex)
            </div>

            <h1 style={{ fontSize: 30, marginTop: 12 }}>
              Calculadora Inteligente — Full vs Flex
            </h1>

            <p style={{ marginTop: 8 }}>
              Compare o lucro por unidade, margem e o melhor modelo automaticamente.
              Ideal pra decidir envio e precificação no Mercado Livre.
            </p>

            <div className="kpis" style={{ marginTop: 16 }}>
              <div className="kpi">
                <div className="label">Resultado</div>
                <div className="value">Comparação automática</div>
              </div>
              <div className="kpi">
                <div className="label">Visão</div>
                <div className="value">Lucro + Margem</div>
              </div>
              <div className="kpi">
                <div className="label">Modo</div>
                <div className="value">PRO Dark</div>
              </div>
            </div>
          </div>

          <div className="hero-features">
            <div className="feature">
              <div className="t">📦 Full</div>
              <div className="d">Inclui custo extra do Full por unidade.</div>
            </div>
            <div className="feature">
              <div className="t">🚚 Flex</div>
              <div className="d">Considera seu frete médio por unidade.</div>
            </div>
            <div className="feature">
              <div className="t">🎯 Recomendação</div>
              <div className="d">Sugere automaticamente o mais lucrativo.</div>
            </div>
          </div>
        </div>
      </section>

      <CalculadoraFullFlex />
    </div>
  );
}