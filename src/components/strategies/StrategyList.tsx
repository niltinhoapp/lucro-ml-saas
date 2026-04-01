import type { Strategy } from "@/types/strategy";

type Props = {
  strategies: Strategy[];
  selectedStrategyId?: string;
  onSelect: (strategy: Strategy) => void;
};

export default function StrategyList({
  strategies,
  selectedStrategyId,
  onSelect,
}: Props) {
  return (
    <div className="space-y-3">
      {strategies.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item)}
          className={`w-full rounded-2xl border p-4 text-left transition ${
            selectedStrategyId === item.id
              ? "border-cyan-400/40 bg-cyan-400/10"
              : "border-white/10 bg-white/5 hover:bg-white/10"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-sm font-semibold">{item.title}</span>

            {item.isRead ? (
              <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium text-neutral-300">
                Lida
              </span>
            ) : (
              <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-medium text-emerald-300">
                Nova
              </span>
            )}
          </div>

          <p className="mb-3 text-xs text-neutral-400">
            {item.category} • {item.readTime}
          </p>

          <p className="text-sm leading-6 text-neutral-300">{item.summary}</p>
        </button>
      ))}
    </div>
  );
}
