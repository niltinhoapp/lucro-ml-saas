import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/integrations/supabase/server";
import { getEntitlements } from "@/integrations/supabase/entitlements";

import type {
  CatalogDbAnalysis,
  CatalogDbItem,
  CatalogDbSummary,
} from "@/lib/catalog/db";

function brl(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function percent(value: number | null | undefined) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

function riskLabel(value: string | null) {
  if (value === "low") return "baixo";
  if (value === "medium") return "moderado";
  if (value === "high") return "alto";
  return "—";
}

function riskClass(value: string | null) {
  if (value === "low") return "lm-badge-success";
  if (value === "medium") return "lm-badge-warning";
  if (value === "high") return "lm-badge-danger";
  return "";
}

function sortByPriority<T extends { score: number; analysis?: CatalogDbAnalysis }>(
  items: T[]
) {
  return [...items].sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) return scoreDiff;

    const marginA = Number(a.analysis?.estimated_margin ?? 0);
    const marginB = Number(b.analysis?.estimated_margin ?? 0);
    const marginDiff = marginB - marginA;
    if (marginDiff !== 0) return marginDiff;

    const profitA = Number(a.analysis?.estimated_profit ?? 0);
    const profitB = Number(b.analysis?.estimated_profit ?? 0);
    return profitB - profitA;
  });
}

export default async function CatalogoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard/produtos/catalogos");
  }

  const entitlements = await getEntitlements(supabase, user.id);

  if (!entitlements.isPlus) {
    redirect("/checkout?plan=plus");
  }

  const { data: catalog } = await supabase
    .from("supplier_catalogs")
    .select(
      "id, title, file_name, status, source_type, items_count, parsed_at, created_at, updated_at"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<CatalogDbSummary>();

  if (!catalog) {
    notFound();
  }

  const { data: itemsData } = await supabase
    .from("supplier_catalog_items")
    .select(
      "id, raw_name, normalized_name, supplier_sku, brand, category, supplier_cost, min_qty, unit, notes, raw_data, created_at"
    )
    .eq("catalog_id", catalog.id)
    .eq("user_id", user.id);

  const items = (itemsData ?? []) as CatalogDbItem[];
  const itemIds = items.map((item) => item.id);

  const { data: analysisData } = itemIds.length
    ? await supabase
        .from("catalog_item_analysis")
        .select(
          "id, item_id, ml_price_avg, estimated_margin, estimated_profit, opportunity_score, risk_level, ai_summary"
        )
        .in("item_id", itemIds)
        .eq("user_id", user.id)
    : { data: [] as CatalogDbAnalysis[] };

  const analysisMap = new Map(
    (analysisData ?? []).map((entry) => [
      entry.item_id,
      entry as CatalogDbAnalysis,
    ])
  );

  const enriched = items.map((item) => {
    const analysis = analysisMap.get(item.id);
    const score = Number(analysis?.opportunity_score ?? 0);
    const risk = analysis?.risk_level ?? "high";

    return {
      item,
      analysis,
      score,
      risk,
    };
  });

  const oportunidades = sortByPriority(
    enriched.filter((entry) => entry.risk === "low")
  );
  const revisar = sortByPriority(
    enriched.filter((entry) => entry.risk === "medium")
  );
  const evitar = sortByPriority(
    enriched.filter((entry) => entry.risk === "high")
  );
  const topOportunidades = oportunidades.slice(0, 5);
  const totalItens = enriched.length;

  return (
    <div className="lm-page lm-catalog-detail">
      <header className="lm-header">
        <div>
          <span className="lm-eyebrow">Produtos • Catálogo analisado</span>
          <h1>{catalog.title}</h1>
          <p>
            Veja primeiro o que pode dar margem e evite travar dinheiro em item
            fraco.
          </p>
        </div>

        <div className="lm-actions">
          <Link href="/dashboard/produtos/catalogos" className="btn btn-ghost">
            Voltar
          </Link>

          <Link href="/dashboard/operacao/simulador" className="btn btn-primary">
            Simular compra
          </Link>
        </div>
      </header>

      <section className="lm-decision">
        <div className="lm-decision-card success">
          <strong>{oportunidades.length}</strong>
          <span>Oportunidades</span>
        </div>

        <div className="lm-decision-card warning">
          <strong>{revisar.length}</strong>
          <span>Revisar</span>
        </div>

        <div className="lm-decision-card danger">
          <strong>{evitar.length}</strong>
          <span>Evitar</span>
        </div>

        <div className="lm-decision-card">
          <strong>{totalItens}</strong>
          <span>Itens analisados</span>
        </div>
      </section>

      {!!topOportunidades.length && (
        <section className="lm-section">
          <div className="lm-section-heading">
            <div>
              <h2>Melhores oportunidades</h2>
              <p>Comece pelos produtos com melhor combinação de score e margem.</p>
            </div>
          </div>

          <div className="lm-grid">
            {topOportunidades.map(({ item, analysis, score }, index) => (
              <article
                key={item.id}
                className={`lm-product-card ${index === 0 ? "featured" : ""}`}
              >
                <div className="lm-product-card__top">
                  <span className="lm-rank-badge">
                    {index === 0 ? "TOP oportunidade" : `Top ${index + 1}`}
                  </span>

                  <span className={riskClass(analysis?.risk_level ?? null)}>
                    Risco {riskLabel(analysis?.risk_level ?? null)}
                  </span>
                </div>

                <h3>{item.raw_name}</h3>

                <div className="lm-product-metrics">
                  <div>
                    <span>Lucro</span>
                    <strong>{brl(analysis?.estimated_profit)}</strong>
                  </div>

                  <div>
                    <span>Margem</span>
                    <strong>{percent(analysis?.estimated_margin)}</strong>
                  </div>

                  <div>
                    <span>Score</span>
                    <strong>{score}</strong>
                  </div>
                </div>

                <p className="lm-product-summary">
                  {analysis?.ai_summary ??
                    "Produto com bom sinal inicial. Valide concorrência e giro antes da compra."}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="lm-section">
        <div className="lm-section-heading">
          <div>
            <h2>O que vale olhar primeiro</h2>
            <p>Itens com risco baixo e melhor potencial de resultado.</p>
          </div>
        </div>

        {!oportunidades.length ? (
          <div className="lm-empty">
            Nenhuma oportunidade clara encontrada neste catálogo.
          </div>
        ) : (
          <div className="lm-grid">
            {oportunidades.map(({ item, analysis, score }, index) => (
              <article
                key={item.id}
                className={`lm-product-card ${index === 0 ? "featured" : ""}`}
              >
                <div className="lm-product-card__top">
                  <span className="lm-rank-badge">
                    #{index + 1} em prioridade
                  </span>

                  <span className={riskClass(analysis?.risk_level ?? null)}>
                    {riskLabel(analysis?.risk_level ?? null)}
                  </span>
                </div>

                <h3>{item.raw_name}</h3>

                <div className="lm-product-metrics">
                  <div>
                    <span>Lucro</span>
                    <strong>{brl(analysis?.estimated_profit)}</strong>
                  </div>

                  <div>
                    <span>Margem</span>
                    <strong>{percent(analysis?.estimated_margin)}</strong>
                  </div>

                  <div>
                    <span>Score</span>
                    <strong>{score}</strong>
                  </div>
                </div>

                <p className="lm-product-summary">
                  {analysis?.ai_summary ?? "Validar concorrência e giro."}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {!!revisar.length && (
        <section className="lm-section">
          <div className="lm-section-heading">
            <div>
              <h2>Revisar antes de decidir</h2>
              <p>Itens com sinal misto. Ainda podem funcionar, mas exigem validação.</p>
            </div>
          </div>

          <div className="lm-grid">
            {revisar.map(({ item, analysis, score }) => (
              <article key={item.id} className="lm-product-card warn">
                <div className="lm-product-card__top">
                  <span className="lm-rank-badge">Score {score}</span>
                  <span className={riskClass(analysis?.risk_level ?? null)}>
                    {riskLabel(analysis?.risk_level ?? null)}
                  </span>
                </div>

                <h3>{item.raw_name}</h3>

                <div className="lm-product-metrics">
                  <div>
                    <span>Lucro</span>
                    <strong>{brl(analysis?.estimated_profit)}</strong>
                  </div>

                  <div>
                    <span>Margem</span>
                    <strong>{percent(analysis?.estimated_margin)}</strong>
                  </div>
                </div>

                <p className="lm-product-summary">
                  {analysis?.ai_summary ??
                    "Precisa validar preço, concorrência e espaço de margem."}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {!!evitar.length && (
        <section className="lm-section">
          <div className="lm-section-heading">
            <div>
              <h2>Evitar agora</h2>
              <p>Itens com risco alto ou margem fraca no cenário atual.</p>
            </div>
          </div>

          <div className="lm-grid">
            {evitar.map(({ item, analysis, score }) => (
              <article key={item.id} className="lm-product-card danger">
                <div className="lm-product-card__top">
                  <span className="lm-rank-badge">Score {score}</span>
                  <span className={riskClass(analysis?.risk_level ?? null)}>
                    {riskLabel(analysis?.risk_level ?? null)}
                  </span>
                </div>

                <h3>{item.raw_name}</h3>

                <div className="lm-product-metrics">
                  <div>
                    <span>Lucro</span>
                    <strong>{brl(analysis?.estimated_profit)}</strong>
                  </div>

                  <div>
                    <span>Margem</span>
                    <strong>{percent(analysis?.estimated_margin)}</strong>
                  </div>
                </div>

                <p className="lm-product-summary">
                  {analysis?.ai_summary ?? "Margem ruim ou risco alto no momento."}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="lm-section">
        <div className="lm-section-heading">
          <div>
            <h2>Visão completa</h2>
            <p>Resumo final para comparar custo, margem, lucro e risco.</p>
          </div>
        </div>

        <div className="lm-table-wrap">
          <table className="lm-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Custo</th>
                <th>Preço ML</th>
                <th>Margem</th>
                <th>Lucro</th>
                <th>Score</th>
                <th>Risco</th>
              </tr>
            </thead>

            <tbody>
              {[...oportunidades, ...revisar, ...evitar].map(
                ({ item, analysis, score }) => (
                  <tr key={item.id}>
                    <td>{item.raw_name}</td>
                    <td>{brl(item.supplier_cost)}</td>
                    <td>{brl(analysis?.ml_price_avg)}</td>
                    <td>{percent(analysis?.estimated_margin)}</td>
                    <td>{brl(analysis?.estimated_profit)}</td>
                    <td>{score}</td>
                    <td>
                      <span className={riskClass(analysis?.risk_level ?? null)}>
                        {riskLabel(analysis?.risk_level ?? null)}
                      </span>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}