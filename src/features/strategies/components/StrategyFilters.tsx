"use client";

type FilterValue = "all" | "new" | "read";

type StrategyFiltersProps = {
  activeFilter: FilterValue;
  onChange: (value: FilterValue) => void;
};

const FILTERS: Array<{ label: string; value: FilterValue }> = [
  { label: "Todas", value: "all" },
  { label: "Novas", value: "new" },
  { label: "Lidas", value: "read" },
];

export function StrategyFilters({ activeFilter, onChange }: StrategyFiltersProps) {
  return (
    <div className="lm-filters" role="tablist" aria-label="Filtros de estratégias">
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.value;

        return (
          <button
            key={filter.value}
            type="button"
            className={`lm-filter-btn ${isActive ? "is-active" : ""}`}
            onClick={() => onChange(filter.value)}
            aria-pressed={isActive}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}


