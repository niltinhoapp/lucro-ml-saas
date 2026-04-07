"use client";

import type { Strategy } from "@/types/strategy";

type Props = {
  strategy: Strategy;
  onOpen: (strategy: Strategy) => void;
  onMarkAsRead: (id: string) => void;
};

export default function StrategyWeeklyCard({
  strategy,
  onOpen,
  onMarkAsRead,
}: Props) {
  return (
    <div className="lm-weekly-card">
      <h3>{strategy.title}</h3>
      <p>{strategy.summary ?? ""}</p>

      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={() => onOpen(strategy)}>
          Abrir
        </button>

        {!strategy.isRead && (
          <button type="button" onClick={() => onMarkAsRead(strategy.id)}>
            Marcar como lida
          </button>
        )}
      </div>
    </div>
  );
}