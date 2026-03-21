import RadarPdfUpload from "@/components/radar/RadarPdfUpload";

export default function CatalogosPage() {
  return (
    <main className="min-h-screen px-4 py-8 text-white bg-zinc-950 md:px-6">
      <div className="mx-auto space-y-6 max-w-7xl">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
            Catálogos
          </p>
          <h1 className="text-3xl font-semibold">
            Analisar catálogo com IA + Mercado Livre
          </h1>
          <p className="max-w-3xl text-sm text-zinc-400">
            Envie um PDF para a IA identificar os produtos e estimar potencial
            de revenda com sinais públicos do Mercado Livre.
          </p>
        </header>

        <RadarPdfUpload />
      </div>
    </main>
  );
}