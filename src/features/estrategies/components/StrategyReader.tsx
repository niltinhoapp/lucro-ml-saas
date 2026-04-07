"use client";

import type { Strategy } from "@/types/strategy";

type Props = {
  strategy: Strategy | null;
  onMarkAsRead: (id: string) => void;
};

export default function StrategyReader({ strategy, onMarkAsRead }: Props) {
  if (!strategy) {
    return <div>Selecione uma estratégia.</div>;
  }

  return (
    <div className="lm-strategy-reader">
      <h2>{strategy.title}</h2>
      <p>{strategy.summary ?? ""}</p>

      {!strategy.isRead && (
        <button type="button" onClick={() => onMarkAsRead(strategy.id)}>
          Marcar como lida
        </button>
      )}
    </div>
  );
}