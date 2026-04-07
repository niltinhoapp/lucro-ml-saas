"use client";

import { useMemo, useState } from "react";
import { Bell, Sparkles, Target } from "lucide-react";
import { useStrategies } from "@/features/strategies/hooks/useStrategies";
import { StrategyFilters } from "@/features/strategies/components/StrategyFilters";
import { StrategyList } from "@/features/strategies/components/StrategyList";
import { StrategyDetail } from "@/features/strategies/components/StrategyDetail";
import { StrategyRecommendationPanel } from "@/features/strategies/components/StrategyRecommendationPanel";
import type { Strategy } from "@/features/strategies/types";

type FilterValue = "all" | "new" | "read";

export function StrategiesShell() {
  const { data, isLoading, error, mutate } = useStrategies();
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strategies = data?.strategies ?? [];
  const recommendations = data?.recommendations ?? [];

  const filteredStrategies = useMemo(() => {
    if (activeFilter === "new") {
      return strategies.filter((item) => !item.isRead);
    }

    if (activeFilter === "read") {
      return strategies.filter((item) => item.isRead);
    }

    return strategies;
  }, [activeFilter, strategies]);

  const selectedStrategy: Strategy | null =
    filteredStrategies.find((item) => item.id === selectedId) ??
    filteredStrategies[0] ??
    null;

  const unreadCount = strategies.filter((item) => !item.isRead).length;

  async function handleMarkAsRead(id: string) {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/strategies/${id}/read`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Falha ao marcar estratégia como lida.");
      }

      await mutate();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="lm-strategies-loading">Carregando estratégias...</div>;
  }

  if (error) {
    return (
      <div className="lm-strategies-error">
        <strong>Não foi possível carregar as estratégias.</strong>
        <p>Tente novamente em instantes.</p>
      </div>
    );
  }

  return (
    <div className="lm-strategies-page">
      <section className="lm-strategies-hero">
        <div className="lm-strategies-hero__main">
          <div className="lm-chip-premium">
            <Sparkles size={16} />
            <span>Plano Plus • Inteligência Estratégica</span>
          </div>

          <h1 className="lm-title">Central de Estratégias ML</h1>
          <p className="lm-subtitle">
            Técnicas práticas para melhorar margem, competitividade,
            posicionamento e tomada de decisão no Mercado Livre.
          </p>

          <div className="lm-hero-stats">
            <div className="lm-stat-card">
              <Bell size={18} />
              <div>
                <strong>{unreadCount} não lidas</strong>
                <span>Disponíveis agora</span>
              </div>
            </div>

            <div className="lm-stat-card">
              <Target size={18} />
              <div>
                <strong>Foco em execução</strong>
                <span>Aplicação prática semanal</span>
              </div>
            </div>
          </div>
        </div>

        <StrategyRecommendationPanel items={recommendations} />
      </section>

      <section className="lm-strategies-layout">
        <div className="lm-strategies-column">
          <StrategyFilters
            activeFilter={activeFilter}
            onChange={setActiveFilter}
          />

          <StrategyList
            items={filteredStrategies}
            selectedId={selectedStrategy?.id ?? null}
            onSelect={setSelectedId}
          />
        </div>

        <StrategyDetail
          strategy={selectedStrategy}
          onMarkAsRead={handleMarkAsRead}
          isSubmitting={isSubmitting}
        />
      </section>
    </div>
  );
}





