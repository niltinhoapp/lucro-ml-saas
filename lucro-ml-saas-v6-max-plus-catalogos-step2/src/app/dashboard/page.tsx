import Link from "next/link";

const kpis = [
  { label: "SKUs saudáveis", value: "18", tone: "good", note: "Produtos com margem protegida." },
  { label: "Risco de margem", value: "5", tone: "warn", note: "Itens pedindo correção rápida." },
  { label: "Kits sugeridos", value: "12", tone: "info", note: "Combinações para elevar ticket." },
  { label: "Ações hoje", value: "7", tone: "good", note: "Próximos passos recomendados." },
  { label: "Catálogos prontos", value: "3", tone: "info", note: "Lotes já priorizados para compra." },
];

const actions = [
  "Reprecificar os 3 SKUs com margem abaixo de 10%.",
  "Subir um kit campeão para elevar ticket médio sem depender só de desconto.",
  "Separar produtos que giram bem e não merecem mais tráfego pago.",
  "Testar lote menor antes de comprar alto volume no próximo SKU.",
];

export default function DashboardPage() {
  return (
    <div className="market-page page-wrap">
      <section className="seller-hero seller-hero-overview exec-hero">
        <div className="exec-hero-top">
          <div className="exec-hero-copy">
            <span className="badge pro">Painel executivo</span>

            <h1 className="exec-title">
              Ganhe clareza sobre lucro, kits e próximos passos
            </h1>

            <p className="exec-subtitle">
              O seller não precisa de mais números soltos. Precisa de leitura,
              ação e decisão para proteger margem e crescer com mais segurança.
            </p>
          </div>

          <div className="market-hero-actions seller-hero-actions exec-hero-actions">
            <Link href="/dashboard/diagnostico" className="btn btn-primary">
              Ver lucro real
            </Link>
            <Link href="/dashboard/kits" className="btn">
              Gerar kits
            </Link>
            <Link href="/checkout" className="btn btn-ghost">
              Assinar PRO
            </Link>
          </div>
        </div>

        <div className="exec-kpi-grid">
          {kpis.map((item) => (
            <div
              key={item.label}
              className={`market-kpi-card exec-kpi-card tone-${item.tone}`}
            >
              <div className="market-kpi-label">{item.label}</div>
              <div className="market-kpi-value exec-kpi-value">{item.value}</div>
              <div className="exec-kpi-note">{item.note}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="exec-section-grid seller-grid-tight">
        <Link
          href="/dashboard/diagnostico"
          className="card card-premium seller-nav-card exec-section-card"
        >
          <span className="badge ok">Core</span>
          <h3 style={{ marginTop: 14 }}>Detector de prejuízo oculto</h3>
          <p className="muted" style={{ marginTop: 10 }}>
            Mostra onde taxa, frete e devolução estão consumindo sua margem sem
            aparecer de forma clara.
          </p>
        </Link>

        <Link
          href="/dashboard/kits"
          className="card card-premium seller-nav-card exec-section-card"
        >
          <span className="badge pro">Ticket médio</span>
          <h3 style={{ marginTop: 14 }}>Gerador de kits</h3>
          <p className="muted" style={{ marginTop: 10 }}>
            Sugere kit de entrada, campeão e premium para aumentar valor
            percebido e vender melhor.
          </p>
        </Link>

        <Link
          href="/dashboard/simulador"
          className="card card-premium seller-nav-card exec-section-card"
        >
          <span className="badge">Estoque</span>
          <h3 style={{ marginTop: 14 }}>Simulador de compra</h3>
          <p className="muted" style={{ marginTop: 10 }}>
            Evite travar caixa em lote ruim e veja o ROI estimado antes de fazer
            a compra.
          </p>
        </Link>

        <Link
          href="/dashboard/catalogos"
          className="card card-premium seller-nav-card exec-section-card"
        >
          <span className="badge pro">PLUS</span>
          <h3 style={{ marginTop: 14 }}>Análise de catálogos</h3>
          <p className="muted" style={{ marginTop: 10 }}>
            Transforme PDF de fornecedor em tabela priorizada para validar margem
            antes de comprar.
          </p>
        </Link>
      </section>

      <section className="market-grid-2">
        <div className="card card-premium exec-section-card">
          <div className="card-head">
            <div className="min-w-0">
              <h2>Hoje o foco é</h2>
              <p className="subtitle">
                Ações práticas para proteger margem e melhorar operação.
              </p>
            </div>
          </div>

          <div className="market-summary-list">
            {actions.map((item) => (
              <div key={item} className="alert info">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="card card-premium seller-highlight-panel exec-section-card">
          <span className="badge pro">Oferta PRO</span>

          <h2 style={{ marginTop: 14 }}>
            Transforme análise em rotina de operação
          </h2>

          <p className="muted" style={{ marginTop: 12 }}>
            No PRO o seller salva cenários, acompanha histórico e decide mais
            rápido sem depender de planilha paralela.
          </p>

          <div className="checkout-proof" style={{ marginTop: 16 }}>
            <span className="pill good">Diagnósticos ilimitados</span>
            <span className="pill">Kits com histórico</span>
            <span className="pill">Mais clareza de margem</span>
            <span className="pill">Catálogo em PDF no PLUS</span>
          </div>

          <div
            className="pro-upgrade-actions"
            style={{ marginTop: 18 }}
          >
            <Link href="/checkout" className="btn btn-primary">
              Assinar PRO
            </Link>
            <Link href="/dashboard/radar" className="btn btn-ghost">
              Ver oportunidades
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}