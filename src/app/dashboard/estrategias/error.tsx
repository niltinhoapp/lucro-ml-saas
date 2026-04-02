"use client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function StrategiesErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="lm-strat-error">
      <strong>Não foi possível carregar a central de estratégias.</strong>
      <p>{error.message || "Ocorreu um erro inesperado."}</p>

      <button type="button" className="lm-strat-error__btn" onClick={() => reset()}>
        Tentar novamente
      </button>
    </div>
  );
}