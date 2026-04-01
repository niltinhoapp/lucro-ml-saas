import type { Strategy } from "@/types/strategy";

type Props = {
  strategy: Strategy | null;
  unreadCount: number;
  onOpen: () => void;
};

export default function StrategyHomeCard({
  strategy,
  unreadCount,
  onOpen,
}: Props) {
  if (!strategy) return null;

  return (
    <section className="p-5 border rounded-3xl border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-neutral-900 to-neutral-900">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-cyan-300">
            💡 Estratégia da semana
          </p>
          <h3 className="mt-2 text-xl font-bold text-white">{strategy.title}</h3>
          <p className="max-w-2xl mt-3 text-sm leading-6 text-neutral-300">
            {strategy.summary}
          </p>
        </div>

        <div className="px-4 py-3 text-sm border rounded-2xl border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
          🔔 {unreadCount} não lida{unreadCount === 1 ? "" : "s"}
        </div>
      </div>

      <div className="mt-5">
        <button
          onClick={onOpen}
          className="px-5 py-3 text-sm font-semibold transition rounded-2xl bg-cyan-400 text-neutral-950 hover:opacity-90"
        >
          Abrir Central de Estratégias
        </button>
      </div>
    </section>
  );
}




