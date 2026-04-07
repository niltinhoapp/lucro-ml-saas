"use client";

export default function SimuladorError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="lm-sim-error">
      <strong>Não foi possível carregar o simulador.</strong>
      <p>{error.message}</p>

      <button type="button" className="lm-sim-error__btn" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}
