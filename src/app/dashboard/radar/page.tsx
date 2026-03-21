import RadarPublicSearch from "@/components/radar/RadarPublicSearch";
import RadarPdfUpload from "@/components/radar/RadarPdfUpload";


export default function RadarPage() {
  return (
    <main className="min-h-screen px-4 py-8 text-white bg-zinc-950 md:px-6">
      <div className="mx-auto space-y-6 max-w-7xl">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
            Radar ML
          </p>
          <h1 className="text-3xl font-semibold">
            Descubra oportunidades com base na busca pública
          </h1>
          <p className="max-w-3xl text-sm text-zinc-400">
            Essa etapa usa a API pública do Mercado Livre para gerar um ranking
            inicial e uma leitura inteligente do radar.
          </p>
        </header>

        <RadarPdfUpload />
        <RadarPublicSearch />
      </div>
    </main>
  );
}