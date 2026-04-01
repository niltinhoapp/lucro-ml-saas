"use client";

import type { StrategyRecommendation } from "@/features/strategies/types";

type StrategyRecommendationPanelProps = {
  items: StrategyRecommendation[];
};

export function StrategyRecommendationPanel({
  items,
}: StrategyRecommendationPanelProps) {
  return (
    <div className="lm-recommendations-panel">
      <h2>Sugestões da IA</h2>

      {items.length === 0 ? (
        <p>Sem sugestões no momento.</p>
      ) : (
        <div className="lm-recommendation-list">
          {items.map((item) => (
            <div key={item.id} className="lm-recommendation-card">
              <strong>{item.title}</strong>
              <p>{item.reason}</p>
              <span className="lm-recommendation-score">Score {item.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


