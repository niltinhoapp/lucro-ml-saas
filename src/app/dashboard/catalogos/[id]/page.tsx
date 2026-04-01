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
  if (value === "low") return "good";
  if (value === "medium") return "warn";
  if (value === "high") return "danger";
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

  // BLOQUEIO SEVERO: só PLUS entra
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
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const items = (itemsData ?? []) as CatalogDbItem[];
  const itemIds = items.map((item) => item.id);

  const { data: analysisData } = itemIds.length
    ? await supabase
        .from("catalog_item_analysis")
        .select(
          "id, item_id, ml_search_term, ml_price_avg, ml_price_min, ml_price_max, estimated_fees, estimated_shipping, estimated_margin, estimated_profit, demand_score, competition_score, opportunity_score, risk_level, analysis, ai_summary, created_at, updated_at"
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

  const promising = (analysisData ?? []).filter(
    (entry) => (entry as CatalogDbAnalysis).risk_level === "low"
  ).length;

  const avgScore = (analysisData ?? []).length
    ? (analysisData ?? []).reduce(
        (acc, entry) =>
          acc + Number((entry as CatalogDbAnalysis).opportunity_score ?? 0),
        0
      ) / (analysisData ?? []).length
    : 0;

  return (
    <div className="market-page page-wrap">
      <section className="seller-hero seller-hero-overview exec-hero">
        <div className="exec-hero-top">
          <div className="exec-hero-copy">
            <span className="badge pro">Detalhe do catálogo</span>
            <h1 className="exec-title">{catalog.title}</h1>
            <p className="exec-subtitle">
              Revise os itens salvos e veja o que vale testar, comprar ou
              descartar.
            </p>
          </div>

          <div className="catalog-detail-actions">
            <Link href="/dashboard/produtos/catalogos" className="btn btn-secondary">
              Voltar
            </Link>
            <Link href="/dashboard/operacao/simulador" className="btn btn-primary">
              Simular compra
            </Link>
          </div>
        </div>
      </section>

      <section className="catalog-stats-grid">
        <div className="card catalog-stat-card">
          <div className="market-kpi-label">Status</div>
          <div className="market-kpi-value">{catalog.status}</div>
        </div>

        <div className="card catalog-stat-card">
          <div className="market-kpi-label">Itens</div>
          <div className="market-kpi-value">{catalog.items_count}</div>
        </div>

        <div className="card catalog-stat-card">
          <div className="market-kpi-label">Promissores</div>
          <div className="market-kpi-value">{promising}</div>
        </div>

        <div className="card catalog-stat-card">
          <div className="market-kpi-label">Score médio</div>
          <div className="market-kpi-value">{avgScore.toFixed(0)}</div>
        </div>
      </section>

      <section className="card card-premium">
        <div className="card-head">
          <div>
            <h2>Resumo do arquivo</h2>
            <p className="subtitle">
              Tipo: <strong>{catalog.source_type}</strong> • criado em{" "}
              <strong>
                {new Date(catalog.created_at).toLocaleString("pt-BR")}
              </strong>
            </p>
          </div>
        </div>

        <div className="catalog-history-meta">
          <span className="pill">Arquivo: {catalog.file_name ?? "—"}</span>
          <span className="pill">
            Última atualização:{" "}
            {new Date(catalog.updated_at).toLocaleString("pt-BR")}
          </span>
          <span className="pill">
            Parse:{" "}
            {catalog.parsed_at
              ? new Date(catalog.parsed_at).toLocaleString("pt-BR")
              : "—"}
          </span>
        </div>
      </section>

      <section className="card card-premium">
        <div className="card-head">
          <div>
            <h2>Itens salvos</h2>
            <p className="subtitle">
              Veja custo, margem, score e risco de cada item.
            </p>
          </div>
        </div>

        {!items.length ? (
          <div className="alert warn">Esse catálogo ainda não possui itens salvos.</div>
        ) : (
          <div className="catalog-table-wrap">
            <table className="catalog-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Custo</th>
                  <th>Preço médio ML</th>
                  <th>Margem</th>
                  <th>Lucro</th>
                  <th>Score</th>
                  <th>Risco</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const analysis = analysisMap.get(item.id);

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="catalog-product-name">{item.raw_name}</div>
                        <div className="catalog-product-meta">
                          {item.category ?? "Geral"} •{" "}
                          {item.brand ?? "Marca não identificada"}
                        </div>
                        <div className="catalog-row-summary">
                          {analysis?.ai_summary ??
                            item.notes ??
                            "Sem resumo disponível."}
                        </div>
                      </td>
                      <td>{brl(item.supplier_cost)}</td>
                      <td>{brl(analysis?.ml_price_avg)}</td>
                      <td>
                        {Number(analysis?.estimated_margin ?? 0).toFixed(1)}%
                      </td>
                      <td>{brl(analysis?.estimated_profit)}</td>
                      <td>
                        <strong>{analysis?.opportunity_score ?? 0}</strong>
                      </td>
                      <td>
                        <span
                          className={`badge ${riskClass(
                            analysis?.risk_level ?? null
                          )}`}
                        >
                          {riskLabel(analysis?.risk_level ?? null)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

