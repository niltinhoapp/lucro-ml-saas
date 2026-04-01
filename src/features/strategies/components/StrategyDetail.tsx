"use client";

import type { Strategy } from "@/features/strategies/types";

type StrategyDetailProps = {
  strategy: Strategy | null;
  onMarkAsRead: (id: string) => Promise<void>;
  isSubmitting: boolean;
};

export function StrategyDetail({
  strategy,
  onMarkAsRead,
  isSubmitting,
}: StrategyDetailProps) {
  if (!strategy) {
    return (
      <aside className="lm-strategy-detail">
        <p>Selecione uma estratégia para visualizar os detalhes.</p>
      </aside>
    );
  }

  return (
    <aside className="lm-strategy-detail">
      <div className="lm-strategy-detail__header">
        <span className="lm-detail-category">{strategy.category}</span>
        <span className="lm-detail-reading">{strategy.estimatedReadMinutes} min</span>
      </div>

      <h2>{strategy.title}</h2>
      <p className="lm-strategy-detail__summary">{strategy.summary}</p>

      <div className="lm-sections">
        {strategy.content.map((section) => (
          <section key={section.title} className="lm-section-block">
            <h3>{section.title}</h3>
            <p>{section.text}</p>
          </section>
        ))}
      </div>

      {!strategy.isRead ? (
        <button
          type="button"
          className="lm-btn-primary"
          onClick={() => onMarkAsRead(strategy.id)}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : "Marcar como lida"}
        </button>
      ) : (
        <div className="lm-read-state">Estratégia já marcada como lida.</div>
      )}
    </aside>
  );
}