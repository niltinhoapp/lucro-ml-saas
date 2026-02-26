import Link from "next/link";

export default function CheckoutPage() {
  return (
    <div className="page">
      <div className="topbar">
        <div>
          <span className="badge pro">💳 PLANO PRO</span>
          <h2 style={{ marginTop: 10 }}>Desbloqueie o PRO e aumente seu lucro</h2>
          <p className="subtitle">
            DRE completo, histórico ilimitado, exportação e insights automáticos. Aqui você liga o pagamento depois
            (Stripe/Mercado Pago/Pix).
          </p>
        </div>

        <div className="actions">
          <Link href="/demo" className="btn">
            Ver demo
          </Link>
          <Link href="/dashboard" className="btn btn-primary">
            Entrar
          </Link>
        </div>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" as any }}>
        <div className="card card-premium">
          <span className="badge">FREE</span>
          <h3 style={{ marginTop: 10 }}>Essencial</h3>
          <p className="muted" style={{ marginTop: 6 }}>
            Para testar e organizar o básico.
          </p>

          <div style={{ marginTop: 14, fontWeight: 950, fontSize: 30 }}>
            R$ 0 <span className="muted" style={{ fontSize: 14, fontWeight: 900 }}>/mês</span>
          </div>

          <ul style={{ marginTop: 12, paddingLeft: 18, color: "rgba(229,231,235,.9)", fontWeight: 900 }}>
            <li>Acesso ao painel</li>
            <li>DRE básico</li>
            <li>Fluxo de caixa simples</li>
            <li>Full vs Flex (limitado)</li>
          </ul>

          <div style={{ marginTop: 16 }}>
            <Link href="/dashboard" className="btn">
              Começar grátis
            </Link>
          </div>
        </div>

        <div className="card card-premium">
          <span className="badge pro">PRO • Recomendado</span>
          <h3 style={{ marginTop: 10 }}>Premium</h3>
          <p className="muted" style={{ marginTop: 6 }}>
            Para vender com clareza e escala.
          </p>

          <div style={{ marginTop: 14, fontWeight: 950, fontSize: 30 }}>
            R$ 29,90{" "}
            <span className="muted" style={{ fontSize: 14, fontWeight: 900 }}>/mês</span>
          </div>

          <ul style={{ marginTop: 12, paddingLeft: 18, color: "rgba(229,231,235,.9)", fontWeight: 900 }}>
            <li>DRE completo + categorias</li>
            <li>Exportação (PDF/CSV)</li>
            <li>Histórico ilimitado</li>
            <li>Insights/alertas de margem</li>
            <li>Full vs Flex completo</li>
            <li>Suporte prioritário</li>
          </ul>

          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-primary" type="button">
              Assinar PRO (em breve)
            </button>
            <Link href="/dashboard" className="btn btn-ghost">
              Ver painel
            </Link>
          </div>

          <div className="alert info" style={{ marginTop: 14 }}>
            🔒 Pagamento: conecte Stripe/Mercado Pago depois. Por enquanto, esta página já vende o valor.
          </div>
        </div>
      </div>

      <div className="card card-premium">
        <h3>❓ Perguntas rápidas</h3>

        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          <details>
            <summary>O que entra no DRE completo?</summary>
            <pre>
Receita, comissões, fretes, logística, CMV, impostos, despesas operacionais e lucro.
Classificação por categoria e comparativos.
            </pre>
          </details>

          <details>
            <summary>Posso cancelar quando quiser?</summary>
            <pre>
Sim. O PRO é mensal e pode ser cancelado. (quando você ligar o gateway de pagamento)
            </pre>
          </details>

          <details>
            <summary>Vou conseguir exportar relatórios?</summary>
            <pre>
No PRO: PDF/CSV. Ideal para reuniões e tomada de decisão.
            </pre>
          </details>
        </div>
      </div>

      <div className="alert success">✅ Demo + Checkout alinhados com seu PRO DARK.</div>
    </div>
  );
}