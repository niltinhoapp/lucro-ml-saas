"use client";

import type { Strategy } from "@/features/strategies/types";

type StrategyListProps = {
  items: Strategy[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function StrategyList({ items, selectedId, onSelect }: StrategyListProps) {
  if (items.length === 0) {
    return (
      <div className="lm-empty-state">
        <strong>Nenhuma estratégia encontrada</strong>
        <p>Ajuste o filtro para ver outros conteúdos.</p>
      </div>
    );
  }

  return (
    <div className="lm-strategy-list">
      {items.map((item) => {
        const isSelected = selectedId === item.id;

        return (
          <button
            key={item.id}
            type="button"
            className={`lm-strategy-card ${isSelected ? "is-selected" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            <div className="lm-strategy-card__top">
              <h3>{item.title}</h3>
              <span className={`lm-status-badge ${item.isRead ? "is-read" : "is-new"}`}>
                {item.isRead ? "Lida" : "Nova"}
              </span>
            </div>

            <div className="lm-strategy-card__meta">
              <span>{item.category}</span>
              <span>{item.estimatedReadMinutes} min</span>
            </div>

            <p>{item.summary}</p>
          </button>
        );
      })}
    </div>
  );
}


