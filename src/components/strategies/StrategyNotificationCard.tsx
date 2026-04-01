"use client";

import { useRouter } from "next/navigation";
import type { Strategy } from "@/types/strategy";

type Props = {
  unreadCount: number;
  strategy: Strategy | null;
};

export default function StrategyNotificationCard({
  unreadCount,
  strategy,
}: Props) {
  const router = useRouter();

  if (!strategy || unreadCount <= 0) return null;

  return (
    <section className="p-5 border rounded-3xl border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-neutral-900 to-neutral-900">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-cyan-300">
            🔔 Nova estratégia disponível
          </p>

          <h3 className="mt-2 text-xl font-bold text-white">
            {strategy.title}
          </h3>

          <p className="max-w-2xl mt-3 text-sm leading-6 text-neutral-300">
            {strategy.summary}
          </p>

          <p className="mt-3 text-xs text-neutral-400">
            Você tem {unreadCount} estratégia{unreadCount === 1 ? "" : "s"} não lida
            {unreadCount === 1 ? "" : "s"}.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push("/dashboard/estrategias")}
            className="px-5 py-3 text-sm font-semibold transition rounded-2xl bg-cyan-400 text-neutral-950 hover:opacity-90"
          >
            Abrir estratégias
          </button>
        </div>
      </div>
    </section>
  );
}
