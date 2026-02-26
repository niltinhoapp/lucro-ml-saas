import Link from "next/link";

export default function DemoPage() {
  return (
    <div className="page">
      <div className="topbar">
        <div>
          <span className="badge pro">👁️ DEMO</span>
          <h2 style={{ marginTop: 10 }}>Veja como fica o painel por dentro</h2>
          <p className="subtitle">
            Demonstração do visual premium: KPIs, cards e módulos. Use essa tela como vitrine para vender o PRO.
          </p>
        </div>

        <div className="actions">
          <Link href="/checkout" className="btn btn-primary">
            Assinar PRO
          </Link>
          <Link href="/dashboard" className="btn">
            Entrar
          </Link>
          <Link href="/" className="btn btn-ghost">
            Voltar Home
          </Link>
        </div>
      </div>

      <div className="grid-3">
        <div className="kpi-card kpi-receita">
          <div className="kpi-label">Receita (exemplo)</div>
          <div className="kpi-value">R$ 18.420,30</div>
          <div className="muted" style={{ marginTop: 8, fontWeight: 900 }}>
            +12% vs. mês anterior
          </div>
        </div>

        <div className="kpi-card kpi-despesas">
          <div className="kpi-label">Custos/Taxas (exemplo)</div>
          <div className="kpi-value">R$ 9.106,10</div>
          <div className="muted" style={{ marginTop: 8, fontWeight: 900 }}>
            Logística + comissões + impostos
          </div>
        </div>

        <div className="kpi-card kpi-margem-good">
          <div className="kpi-label">Lucro (exemplo)</div>
          <div className="kpi-value">R$ 5.980,40</div>
          <div className="muted" style={{ marginTop: 8, fontWeight: 900 }}>
            Margem: 32,4%
          </div>
        </div>
      </div>

      <div className="card card-premium">
        <h3>📊 DRE Automático (demo)</h3>
        <p className="muted" style={{ marginTop: 6 }}>
          Upload → normalização → receita, taxas, logística, CMV, lucro e margem.
        </p>

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/dashboard/dre" className="btn btn-primary">
            Abrir DRE
          </Link>
          <Link href="/checkout" className="btn btn-ghost">
            Desbloquear PRO
          </Link>
        </div>
      </div>

      <div className="card card-premium">
        <h3>🚚 Full vs Flex (demo)</h3>
        <p className="muted" style={{ marginTop: 6 }}>
          Simulação por unidade para descobrir o modelo mais lucrativo.
        </p>

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/dashboard/full-vs-flex" className="btn">
            Simular agora
          </Link>
          <span className="badge ok">✅ Premium UI</span>
        </div>
      </div>

      <div className="alert info">💡 Dica: mantenha “Assinar PRO” sempre visível nessa demo.</div>
    </div>
  );
}