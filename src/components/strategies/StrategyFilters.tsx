import { STRATEGY_FILTERS, type StrategyFilter } from "@/types/strategy";

type Props = {
  selectedFilter: StrategyFilter;
  onChange: (filter: StrategyFilter) => void;
};

export default function StrategyFilters({
  selectedFilter,
  onChange,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {STRATEGY_FILTERS.map((filter) => {
        const active = selectedFilter === filter;

        return (
          <button
            key={filter}
            onClick={() => onChange(filter)}
            className={`rounded-full px-3 py-2 text-xs font-medium transition ${
              active
                ? "bg-cyan-400 text-neutral-950"
                : "bg-white/5 text-neutral-300 hover:bg-white/10"
            }`}
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
}
