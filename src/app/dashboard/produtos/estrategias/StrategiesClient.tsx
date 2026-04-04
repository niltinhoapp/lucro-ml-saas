"use client";

import { useMemo, useState } from "react";
import { mockStrategies } from "@/data/mockStrategies";
import type { Strategy, StrategyFilter } from "@/types/strategy";
import StrategyWeeklyCard from "@/components/strategies/StrategyWeeklyCard";
import StrategyFilters from "@/components/strategies/StrategyFilters";
import StrategyList from "@/components/strategies/StrategyList";
import StrategyReader from "@/components/strategies/StrategyReader";

export default function StrategiesClient() {
  const [strategies, setStrategies] = useState<Strategy[]>(mockStrategies);
  const [selectedFilter, setSelectedFilter] =
    useState<StrategyFilter>("Todas");
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(
    mockStrategies[0] ?? null
  );

  const accessibleStrategies = useMemo(() => {
    return strategies.filter((item) => item.accessLevel === "pro");
  }, [strategies]);

  const unreadCount = accessibleStrategies.filter(
    (item) => !item.isRead
  ).length;

  const strategyOfWeek = useMemo(() => {
    return (
      accessibleStrategies.find((item) => !item.isRead) ??
      accessibleStrategies[0] ??
      null
    );
  }, [accessibleStrategies]);

  const filteredStrategies = useMemo(() => {
    return accessibleStrategies.filter((item) => {
      if (selectedFilter === "Todas") return true;
      if (selectedFilter === "Novas") return item.isNew && !item.isRead;
      if (selectedFilter === "Lidas") return item.isRead;
      return item.category === selectedFilter;
    });
  }, [selectedFilter, accessibleStrategies]);

  function handleSelectStrategy(strategy: Strategy) {
    setSelectedStrategy(strategy);
  }

  function handleMarkAsRead(id: string) {
    setStrategies((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isRead: true, isNew: false } : item
      )
    );

    setSelectedStrategy((prev) =>
      prev && prev.id === id ? { ...prev, isRead: true, isNew: false } : prev
    );
  }

  return (
    <div className="lm-strat-shell">
      <div className="lm-strat-container">
        <header className="lm-strat-header">
          <div className="lm-strat-header__copy">
            <span className="lm-strat-chip">
              Plano Plus • Inteligência Estratégica
            </span>

            <h1 className="lm-strat-title">Central de Estratégias ML</h1>

            <p className="lm-strat-subtitle">
              Técnicas práticas para melhorar margem, competitividade,
              posicionamento e tomada de decisão no Mercado Livre.
            </p>
          </div>

          <div className="lm-strat-unread-box">
            <span className="lm-strat-unread-box__count">{unreadCount}</span>
            <span>
              estratégia{unreadCount === 1 ? "" : "s"} não lida
              {unreadCount === 0 ? "" : " disponível"}
            </span>
          </div>
        </header>

        {strategyOfWeek && (
          <section className="lm-strat-weekly">
            <StrategyWeeklyCard
              strategy={strategyOfWeek}
              onOpen={handleSelectStrategy}
              onMarkAsRead={handleMarkAsRead}
            />
          </section>
        )}

        <section className="lm-strat-layout">
          <aside className="lm-strat-sidebar">
            <StrategyFilters
              selectedFilter={selectedFilter}
              onChange={setSelectedFilter}
            />

            <StrategyList
              strategies={filteredStrategies}
              selectedStrategyId={selectedStrategy?.id}
              onSelect={handleSelectStrategy}
            />
          </aside>

          <main className="lm-strat-main">
            <StrategyReader
              strategy={selectedStrategy}
              onMarkAsRead={handleMarkAsRead}
            />
          </main>
        </section>
      </div>
    </div>
  );
}