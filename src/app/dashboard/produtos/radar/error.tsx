"use client";

type RadarErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardProdutosRadarError({
  error,
  reset,
}: RadarErrorPageProps) {
  return (
    <div className="lm-strategies-error">
      <strong>Não foi possível carregar o Radar ML.</strong>
      <p>{error.message || "Ocorreu um erro inesperado."}</p>

      <button type="button" className="lm-btn-primary" onClick={() => reset()}>
        Tentar novamente
      </button>
    </div>
  );
}
