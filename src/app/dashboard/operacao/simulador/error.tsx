"use client";

export default function SimuladorError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="lm-strategies-error">
      <strong>Não foi possível carregar o Simulador.</strong>
      <p>{error.message}</p>
      <button type="button" className="lm-btn-primary" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}