import { DreInsight } from "@/lib/dre/insights";

const toneClass: Record<DreInsight["level"], string> = {
  success: "ins-card success",
  warning: "ins-card warning",
  danger: "ins-card danger",
  info: "ins-card info",
};

function tagLabel(tag: DreInsight["action_tag"]) {
  switch (tag) {
    case "DADOS":
      return "Dados";
    case "LUCRO":
      return "Lucro";
    case "MARGEM":
      return "Margem";
    case "CUSTO":
      return "Custo";
    case "TAXA":
      return "Taxas";
    case "LOGISTICA":
      return "Logística";
    case "PRECO":
      return "Preço";
    case "ACAO":
      return "Ação";
    default:
      return "Resumo";
  }
}

export default function DreInsights({ insights }: { insights: DreInsight[] }) {
  if (!insights?.length) return null;

  return (
    <section className="ins">
      <div className="ins-head">
        <div>
          <h2 className="ins-title">Pontos de atenção</h2>
          <div className="ins-sub">Veja o que precisa de ajuste.</div>
        </div>
      </div>

      <div className="ins-grid">
        {insights.map((it, idx) => (
          <article key={idx} className={toneClass[it.level]}>
            <div className="ins-top">
              <span className={`ins-chip ${it.action_tag.toLowerCase?.() ?? ""}`}>
                {tagLabel(it.action_tag)}
              </span>

              <span className={`ins-prio p${it.priority}`}>
                {it.priority}
              </span>
            </div>

            <div className="ins-h">{it.title}</div>
            <div className="ins-p">{it.detail}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

