import type { Strategy } from "@/types/strategy";

type Props = {
  strategy: Strategy;
  onOpen: (strategy: Strategy) => void;
  onMarkAsRead: (id: string) => void;
};

export default function StrategyWeeklyCard({
  strategy,
  onOpen,
  onMarkAsRead,
}: Props) {
  return (
    <section className="p-5 border shadow-2xl rounded-3xl border-white/10 bg-gradient-to-br from-neutral-900 via-neutral-900 to-cyan-950/30 md:p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="mb-2 text-sm font-medium text-cyan-300">
            💡 {strategy.weekLabel ?? "Estratégia da Semana"}
          </p>

          <h2 className="text-xl font-bold md:text-2xl">{strategy.title}</h2>

          <p className="max-w-3xl mt-3 text-sm leading-6 text-neutral-300 md:text-base">
            {strategy.summary}
          </p>
        </div>

        {!strategy.isRead && (
          <span className="px-3 py-1 text-xs font-semibold border rounded-full border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
            Nova
          </span>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <InfoBox label="Categoria" value={strategy.category} />
        <InfoBox label="Leitura" value={strategy.readTime} />
        <InfoBox
          label="Status"
          value={strategy.isRead ? "Lida" : "Aguardando leitura"}
        />
        <InfoBox label="Plano" value={strategy.accessLevel.toUpperCase()} />
      </div>

      <div className="flex flex-wrap gap-3 mt-5">
        <button
          onClick={() => onOpen(strategy)}
          className="px-5 py-3 text-sm font-semibold transition rounded-2xl bg-cyan-400 text-neutral-950 hover:opacity-90"
        >
          Ler estratégia completa
        </button>

        {!strategy.isRead && (
          <button
            onClick={() => onMarkAsRead(strategy.id)}
            className="px-5 py-3 text-sm font-semibold text-white transition border rounded-2xl border-white/15 bg-white/5 hover:bg-white/10"
          >
            Marcar como lida
          </button>
        )}
      </div>
    </section>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
      <p className="text-xs tracking-wide uppercase text-neutral-400">{label}</p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}

