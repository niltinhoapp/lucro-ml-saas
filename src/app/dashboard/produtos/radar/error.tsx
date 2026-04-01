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
    <div className="lm-radar-route">
      <div className="lm-radar-alert is-error">
        <strong>Não foi possível carregar o Radar ML.</strong>
        <p>{error.message || "Ocorreu um erro inesperado."}</p>

        <button
          type="button"
          className="lm-radar-btn-primary"
          onClick={() => reset()}
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

