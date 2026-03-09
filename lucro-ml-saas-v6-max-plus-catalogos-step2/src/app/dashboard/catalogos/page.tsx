import Link from "next/link";
import { createServerClient } from "@/supabase/server";
import { getEntitlements } from "@/supabase/entitlements";
import CatalogoAnalyzerClient from "@/components/catalogos/CatalogoAnalyzerClient";
import PlanUpgradeCard from "@/components/pro/PlanUpgradeCard";
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

  const ent = user ? await getEntitlements(supabase, user.id) : null;

  const { data: recentCatalogs } = user
    ? await supabase
        .from("supplier_catalogs")
        .select("id, title, file_name, status, source_type, items_count, parsed_at, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6)
    : { data: [] as CatalogDbSummary[] };

  const catalogs = (recentCatalogs ?? []) as CatalogDbSummary[];
  const analyzedCount = catalogs.filter((item) => item.status === "analyzed").length;
  const totalItems = catalogs.reduce((acc, item) => acc + (item.items_count ?? 0), 0);

  return (
    <div className="market-page page-wrap">
      <section className="seller-hero seller-hero-overview exec-hero">
        <div className="exec-hero-top">
          <div className="exec-hero-copy">
            <span className="badge pro">Catálogos • PLUS</span>
            <h1 className="exec-title">Valide catálogo de fornecedor antes de comprar</h1>
            <p className="exec-subtitle">
              O módulo agora conversa com o Supabase real: salva cada leitura, reaproveita análise por item e mantém o mesmo fluxo visual do restante do sistema.
            </p>
          </div>
        </div>
      </section>

      {ent?.canUseCatalogAnalysis ? null : (
        <PlanUpgradeCard
          badge="PLUS"
          title="Catálogo em PDF liberado no PLUS"
          subtitle="No PLUS você envia catálogo, organiza os itens em tabela e prioriza oportunidades sem criar módulo solto ou fora da lógica do projeto."
        />
      )}

      <section className="catalog-stats-grid">
        <div className="card catalog-stat-card">
          <div className="market-kpi-label">Plano atual</div>
          <div className="market-kpi-value">{(ent?.plan ?? "free").toUpperCase()}</div>
        </div>
        <div className="card catalog-stat-card">
          <div className="market-kpi-label">Catálogos salvos</div>
          <div className="market-kpi-value">{catalogs.length}</div>
        </div>
        <div className="card catalog-stat-card">
          <div className="market-kpi-label">Analisados</div>
          <div className="market-kpi-value">{analyzedCount}</div>
        </div>
        <div className="card catalog-stat-card">
          <div className="market-kpi-label">Itens mapeados</div>
          <div className="market-kpi-value">{totalItems}</div>
        </div>
      </section>

      <CatalogoAnalyzerClient plan={ent?.plan ?? "free"} />

      <section className="card card-premium">
        <div className="card-head">
          <div>
            <h2>Histórico de catálogos</h2>
            <p className="subtitle">
              Cada leitura fica conectada ao banco e pronta para ser revisitada sem precisar reenviar o arquivo.
            </p>
          </div>
        </div>

        {!catalogs.length ? (
          <div className="alert info">
            Nenhum catálogo salvo ainda. Envie o primeiro PDF para montar histórico e reaproveitar suas análises dentro do PLUS.
          </div>
        ) : (
          <div className="catalog-history-grid">
            {catalogs.map((catalog) => (
              <Link key={catalog.id} href={`/dashboard/catalogos/${catalog.id}`} className="card catalog-history-card">
                <div className="catalog-history-top">
                  <span className="badge pro">{catalog.source_type.toUpperCase()}</span>
                  <span className="small">{formatDate(catalog.created_at)}</span>
                </div>
                <h3>{catalog.title}</h3>
                <p className="subtitle">
                  {catalog.file_name ?? "Arquivo sem nome"}
                </p>
                <div className="catalog-history-meta">
                  <span className="pill">Status: {catalog.status}</span>
                  <span className="pill">Itens: {catalog.items_count}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
