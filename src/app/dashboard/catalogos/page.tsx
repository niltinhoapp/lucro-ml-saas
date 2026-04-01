import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/integrations/supabase/server";
import { getEntitlements } from "@/integrations/supabase/entitlements";
import CatalogoAnalyzerClient from "@/features/produtos/catalogos/components/CatalogoAnalyzerClient";
import type { CatalogDbSummary } from "@/lib/catalog/db";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

export default async function CatalogosPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard/produtos/catalogos");
  }

  const ent = await getEntitlements(supabase, user.id);

  // BLOQUEIO SEVERO DE PLANO
  if (!ent.isPlus) {
    redirect("/checkout?plan=plus");
  }

  const { data: recentCatalogs, error } = await supabase
    .from("supplier_catalogs")
    .select(
      "id, title, file_name, status, source_type, items_count, parsed_at, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    throw new Error(`Erro ao carregar catálogos: ${error.message}`);
  }

  const catalogs = (recentCatalogs ?? []) as CatalogDbSummary[];
  const analyzedCount = catalogs.filter((item) => item.status === "analyzed").length;
  const totalItems = catalogs.reduce((acc, item) => acc + (item.items_count ?? 0), 0);

  return (
    <div className="market-page page-wrap">
      <section className="seller-hero seller-hero-overview exec-hero">
        <div className="exec-hero-top">
          <div className="exec-hero-copy">
            <span className="badge pro">Catálogos</span>

            <h1 className="exec-title">Analisar catálogo</h1>

            <p className="exec-subtitle">
              Envie o PDF e veja os produtos encontrados.
            </p>

            <div className="exec-hero-proof">
              <span className="pill good">Plano: {(ent.plan ?? "free").toUpperCase()}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="catalog-stats-grid">
        <div className="card catalog-stat-card">
          <div className="market-kpi-label">Enviados</div>
          <div className="market-kpi-value">{catalogs.length}</div>
        </div>

        <div className="card catalog-stat-card">
          <div className="market-kpi-label">Analisados</div>
          <div className="market-kpi-value">{analyzedCount}</div>
        </div>

        <div className="card catalog-stat-card">
          <div className="market-kpi-label">Produtos</div>
          <div className="market-kpi-value">{totalItems}</div>
        </div>
      </section>

      <CatalogoAnalyzerClient />

      <section className="card card-premium">
        <div className="card-head">
          <div>
            <h2>Histórico</h2>
          </div>
        </div>

        {!catalogs.length ? (
          <div className="alert info">Nenhum catálogo enviado.</div>
        ) : (
          <div className="catalog-history-grid">
            {catalogs.map((catalog) => (
              <Link
                key={catalog.id}
                href={`/dashboard/produtos/catalogos/${catalog.id}`}
                className="card catalog-history-card"
              >
                <div className="catalog-history-top">
                  <span className="badge pro">{catalog.source_type.toUpperCase()}</span>
                  <span className="small">{formatDate(catalog.created_at)}</span>
                </div>

                <h3>{catalog.title}</h3>

                <p className="subtitle">{catalog.file_name ?? "Arquivo sem nome"}</p>

                <div className="catalog-history-meta">
                  <span className="pill">{catalog.status}</span>
                  <span className="pill">{catalog.items_count ?? 0} produtos</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}




