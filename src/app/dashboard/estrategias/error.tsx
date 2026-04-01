"use client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function StrategiesErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="lm-strategies-error">
      <strong>Não foi possível carregar a Central de Estratégias.</strong>
      <p>{error.message || "Ocorreu um erro inesperado."}</p>

      <button type="button" className="lm-btn-primary" onClick={() => reset()}>
        Tentar novamente
      </button>
    </div>
  );
}


