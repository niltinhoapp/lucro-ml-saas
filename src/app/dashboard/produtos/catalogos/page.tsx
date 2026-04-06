import { redirect } from "next/navigation";
import { createServerClient } from "@/integrations/supabase/server";
import CatalogoAnalyzerClient from "@/features/produtos/catalogos/components/CatalogoAnalyzerClient";

export default async function CatalogosPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard/produtos/catalogos");
  }

  return (
    <section className="lm-page-section lm-catalog-page">
      <header className="lm-page-header lm-catalog-page__header">
        <div className="lm-catalog-page__heading">
          <span className="lm-page-eyebrow">Produtos • Catálogos</span>

          <h1>Catálogos de fornecedor</h1>

          <p>
            Envie o catálogo do fornecedor, organize a leitura e identifique
            quais produtos merecem atenção antes de comprar.
          </p>
        </div>
      </header>

      <div className="lm-catalog-page__content">
        <CatalogoAnalyzerClient />
      </div>
    </section>
  );
}