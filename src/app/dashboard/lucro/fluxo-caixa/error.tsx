"use client";

export default function FluxoCaixaError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="lm-cashflow-error">
      <strong>Não foi possível carregar o fluxo de caixa.</strong>
      <p>{error.message}</p>

      <button type="button" className="lm-cashflow-error__btn" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}