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
    <div className="lm-page-section">
      <header className="lm-page-header">
        <h1>Catálogos de fornecedor</h1>
        <p>
          Envie PDFs e descubra produtos com potencial antes de investir.
        </p>
      </header>

      <CatalogoAnalyzerClient />
    </div>
  );
}


