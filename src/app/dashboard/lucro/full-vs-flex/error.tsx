"use client";

export default function FullVsFlexError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="lm-strategies-error">
      <strong>Não foi possível carregar Full vs Flex.</strong>
      <p>{error.message}</p>
      <button type="button" className="lm-btn-primary" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}