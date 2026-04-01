import Link from "next/link";

const sectors = [
  {
    title: "Entender o lucro da operação",
    desc: "Saiba se o produto realmente deixa resultado e descubra onde sua margem está sendo pressionada.",
    questions: [
      "Como saber se esse produto está realmente dando lucro?",
      "O que devo revisar primeiro quando a margem começa a cair?",
    ],
  },
  {
    title: "Ler o lucro real e o DRE",
    desc: "Aprenda a interpretar os números da operação sem complicação e descubra onde agir primeiro.",
    questions: [
      "Como ler o DRE de forma simples?",
      "Quais produtos devo revisar, reprecificar ou pausar primeiro?",
    ],
  },
  {
    title: "Analisar catálogos de fornecedor",
    desc: "Transforme PDF em análise prática para encontrar produtos com mais potencial e menos risco.",
    questions: [
      "Como identificar os produtos mais promissores do catálogo?",
      "Como reduzir risco antes de comprar um lote maior?",
    ],
  },
  {
    title: "Decidir entre logística e kits",
    desc: "Entenda quando cada operação faz mais sentido e como usar kits para aumentar ticket com mais segurança.",
    questions: [
      "Quando o Full pode compensar mais do que o Flex?",
      "Que tipo de kit pode aumentar ticket sem travar estoque?",
    ],
  },
];

export default function AjudaPage() {
  return (
    <div className="page-wrap premium-help-page">
      <section className="premium-help-hero card card-premium">
        <div className="premium-help-copy">
          <span className="badge pro">Ajuda ao seller</span>
          <h1>Encontre orientação para usar melhor cada área do sistema</h1>
          <p className="subtitle">
            Esta área foi pensada para ajudar você a avançar com mais clareza.
            Entenda o que cada parte do Lucro ML resolve, quando usar e qual pode
            ser o melhor próximo passo para sua operação.
          </p>
        </div>

        <div className="premium-help-actions">
          <Link href="/dashboard" className="btn btn-primary">
            Voltar para a central
          </Link>
          <Link href="/checkout" className="btn btn-ghost">
            Ver planos
          </Link>
        </div>
      </section>

      <section className="card card-premium" style={{ marginTop: 24 }}>
        <div className="card-head">
          <div>
            <h2>Dúvidas comuns de quem está usando o Lucro ML</h2>
            <p className="subtitle">
              Escolha a área mais próxima da sua dúvida e encontre uma direção mais clara.
            </p>
          </div>
        </div>

        <div className="premium-help-grid">
          {sectors.map((sector) => (
            <article key={sector.title} className="card card-premium premium-help-card">
              <span className="badge">Ajuda por etapa</span>
              <h2>{sector.title}</h2>
              <p className="muted">{sector.desc}</p>

              <div className="premium-help-list">
                {sector.questions.map((question) => (
                  <div key={question} className="alert info">
                    {question}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="market-grid-2 premium-home-bottom" style={{ marginTop: 24 }}>
        <div className="card card-premium exec-section-card">
          <span className="badge">Orientação rápida</span>

          <h2 style={{ marginTop: 14 }}>Comece pela área que resolve sua dúvida de agora</h2>

          <p className="muted" style={{ marginTop: 10 }}>
            Se sua dúvida está ligada a lucro, comece pelo diagnóstico.
            Se está ligada a produto, use catálogos, radar ou simulador.
            Se está ligada a decisão financeira, vá para DRE e fluxo de caixa.
          </p>

          <div className="pro-upgrade-actions" style={{ marginTop: 18 }}>
            <Link href="/dashboard/diagnostico" className="btn btn-primary">
              Ver diagnóstico
            </Link>
            <Link href="/dashboard/catalogos" className="btn btn-ghost">
              Analisar catálogo
            </Link>
          </div>
        </div>

        <div className="card card-premium exec-section-card">
          <span className="badge pro">Mais recursos</span>

          <h2 style={{ marginTop: 14 }}>Desbloqueie análises mais avançadas da operação</h2>

          <p className="muted" style={{ marginTop: 10 }}>
            Os planos pagos liberam recursos para aprofundar sua leitura de margem,
            avaliar melhor oportunidades e tomar decisões com mais segurança.
          </p>

          <div className="pro-upgrade-actions" style={{ marginTop: 18 }}>
            <Link href="/checkout" className="btn btn-primary">
              Ver planos
            </Link>
            <Link href="/dashboard" className="btn btn-ghost">
              Voltar ao painel
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
