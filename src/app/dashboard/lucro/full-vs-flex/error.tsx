"use client";

export default function FullVsFlexError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="lm-fvf-error">
      <strong>Não foi possível carregar Full vs Flex.</strong>
      <p>{error.message}</p>

      <button type="button" className="lm-fvf-error__btn" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}