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
    <div className="min-h-screen text-white bg-neutral-950">
      <div className="px-4 py-6 mx-auto max-w-7xl md:px-6 lg:px-8">
        <header className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="inline-flex items-center px-3 py-1 mb-2 text-xs font-medium border rounded-full border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
              Plano Plus • Inteligência Estratégica
            </p>

            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Central de Estratégias ML
            </h1>

            <p className="max-w-2xl mt-2 text-sm text-neutral-400 md:text-base">
              Técnicas práticas para melhorar margem, competitividade,
              posicionamento e tomada de decisão no Mercado Livre.
            </p>
          </div>

          <div className="px-4 py-3 text-sm border rounded-2xl border-cyan-500/20 bg-cyan-500/10">
            <span className="font-semibold text-cyan-300">
              🔔 {unreadCount}
            </span>{" "}
            estratégia{unreadCount === 1 ? "" : "s"} não lida
            {unreadCount === 0 ? "" : " disponível"}
          </div>
        </header>

        {strategyOfWeek && (
          <div className="mb-6">
            <StrategyWeeklyCard
              strategy={strategyOfWeek}
              onOpen={handleSelectStrategy}
              onMarkAsRead={handleMarkAsRead}
            />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="p-4 border rounded-3xl border-white/10 bg-neutral-900">
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

          <main className="p-5 border rounded-3xl border-white/10 bg-neutral-900 md:p-6">
            <StrategyReader
              strategy={selectedStrategy}
              onMarkAsRead={handleMarkAsRead}
            />
          </main>
        </div>
      </div>
    </div>
  );
}



