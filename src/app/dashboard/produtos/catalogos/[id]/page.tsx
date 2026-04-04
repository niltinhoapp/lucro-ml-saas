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

  const ent = await getEntitlements(supabase, user.id);

  if (!ent.isPlus) {
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

  if (!catalog) notFound();

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

  // 🔥 CLASSIFICAÇÃO INTELIGENTE (CORE DO UX)
  const enriched = items.map((item) => {
    const analysis = analysisMap.get(item.id);

    return {
      item,
      analysis,
      score: Number(analysis?.opportunity_score ?? 0),
      risk: analysis?.risk_level ?? "high",
    };
  });

  const oportunidades = enriched.filter((e) => e.risk === "low");
  const revisar = enriched.filter((e) => e.risk === "medium");
  const evitar = enriched.filter((e) => e.risk === "high");

  return (
    <div className="lm-page lm-catalog-detail">
      {/* HEADER */}
      <header className="lm-header">
        <div>
          <span className="lm-eyebrow">Catálogo analisado</span>
          <h1>{catalog.title}</h1>
          <p>
            Decida rápido: foque no que tem margem e evite travar dinheiro em
            estoque ruim.
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

      {/* 🔥 DECISÃO RÁPIDA */}
      <section className="lm-decision">
        <div className="lm-decision-card success">
          <strong>{oportunidades.length}</strong>
          <span>Oportunidades reais</span>
        </div>

        <div className="lm-decision-card warning">
          <strong>{revisar.length}</strong>
          <span>Revisar</span>
        </div>

        <div className="lm-decision-card danger">
          <strong>{evitar.length}</strong>
          <span>Evitar</span>
        </div>
      </section>

      {/* 🟢 OPORTUNIDADES */}
      <section className="lm-section">
        <h2>O que vale olhar primeiro</h2>

        {!oportunidades.length ? (
          <div className="lm-empty">
            Nenhuma oportunidade clara encontrada nesse catálogo.
          </div>
        ) : (
          <div className="lm-grid">
            {oportunidades.map(({ item, analysis }) => (
              <div key={item.id} className="lm-product-card">
                <h3>{item.raw_name}</h3>

                <div className="lm-product-metrics">
                  <div>
                    <span>Lucro</span>
                    <strong>{brl(analysis?.estimated_profit)}</strong>
                  </div>
                  <div>
                    <span>Margem</span>
                    <strong>
                      {Number(analysis?.estimated_margin ?? 0).toFixed(1)}%
                    </strong>
                  </div>
                </div>

                <p className="lm-product-summary">
                  {analysis?.ai_summary ?? "Validar concorrência e preço."}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 🟡 REVISAR */}
      {!!revisar.length && (
        <section className="lm-section">
          <h2>Produtos para revisar</h2>

          <div className="lm-grid">
            {revisar.map(({ item }) => (
              <div key={item.id} className="lm-product-card warn">
                <h3>{item.raw_name}</h3>
                <p>Exige validação de preço e concorrência.</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 🔴 EVITAR */}
      {!!evitar.length && (
        <section className="lm-section">
          <h2>Evitar</h2>

          <div className="lm-grid">
            {evitar.map(({ item }) => (
              <div key={item.id} className="lm-product-card danger">
                <h3>{item.raw_name}</h3>
                <p>Margem ruim ou risco alto.</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 📊 TABELA FINAL */}
      <section className="lm-section">
        <h2>Visão completa</h2>

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
              {enriched.map(({ item, analysis }) => (
                <tr key={item.id}>
                  <td>{item.raw_name}</td>
                  <td>{brl(item.supplier_cost)}</td>
                  <td>{brl(analysis?.ml_price_avg)}</td>
                  <td>
                    {Number(analysis?.estimated_margin ?? 0).toFixed(1)}%
                  </td>
                  <td>{brl(analysis?.estimated_profit)}</td>
                  <td>{analysis?.opportunity_score ?? 0}</td>
                  <td>
                    <span className={riskClass(analysis?.risk_level ?? null)}>
                      {riskLabel(analysis?.risk_level ?? null)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}