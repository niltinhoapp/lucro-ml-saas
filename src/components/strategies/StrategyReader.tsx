import type { ReactNode } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Flame,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import type { Strategy } from "@/types/strategy";

type Props = {
  strategy: Strategy | null;
  onMarkAsRead: (id: string) => void;
};

export default function StrategyReader({ strategy, onMarkAsRead }: Props) {
  if (!strategy) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
        <div className="flex flex-col items-center max-w-md gap-4 mx-auto">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <BookOpen size={22} className="text-neutral-300" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">
              Selecione uma estratégia
            </h2>
            <p className="text-sm leading-6 text-neutral-400">
              Escolha um item da lista para visualizar o conteúdo completo, os
              pontos principais e a ação prática da semana.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.18)]">
        <div className="relative">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-indigo-400/10 blur-3xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-5 px-5 py-6 md:px-7">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold border rounded-full border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <Sparkles size={13} />
                  {strategy.category}
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-neutral-300">
                  <Clock3 size={13} />
                  Leitura: {strategy.readTime}
                </span>

                {strategy.isRead ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium border rounded-full border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                    <CheckCircle2 size={13} />
                    Lida
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium border rounded-full border-amber-400/20 bg-amber-400/10 text-amber-300">
                    <Flame size={13} />
                    Nova
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                {strategy.title}
              </h2>

              <p className="max-w-3xl mt-4 text-sm leading-7 text-neutral-300 md:text-base">
                {strategy.summary}
              </p>
            </div>

            {!strategy.isRead ? (
              <button
                onClick={() => onMarkAsRead(strategy.id)}
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/15"
              >
                Marcar como lida
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          icon={<BookOpen size={16} />}
          title="Resumo rápido"
          tone="default"
        >
          {strategy.content.oQueE}
        </SectionCard>

        <SectionCard
          icon={<Sparkles size={16} />}
          title="Exemplo prático"
          tone="default"
        >
          {strategy.content.exemplo}
        </SectionCard>

        <SectionCard
          icon={<CheckCircle2 size={16} />}
          title="Quando usar"
          tone="default"
        >
          {strategy.content.quandoUsar}
        </SectionCard>

        <SectionCard
          icon={<TriangleAlert size={16} />}
          title="Erro comum"
          tone="danger"
        >
          {strategy.content.erroComum}
        </SectionCard>
      </div>

      <SectionCard
        icon={<Flame size={16} />}
        title="Ação prática da semana"
        tone="highlight"
      >
        {strategy.content.acaoDaSemana}
      </SectionCard>
    </div>
  );
}

function SectionCard({
  title,
  children,
  icon,
  tone = "default",
}: {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "highlight" | "danger";
}) {
  const toneClass =
    tone === "highlight"
      ? "border-amber-400/20 bg-amber-400/10"
      : tone === "danger"
      ? "border-rose-400/20 bg-rose-400/10"
      : "border-white/10 bg-white/[0.04]";

  return (
    <section
      className={`rounded-3xl border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.14)] ${toneClass}`}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon ? (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-200">
            {icon}
          </span>
        ) : null}

        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-200">
          {title}
        </h3>
      </div>

      <div className="text-sm leading-7 text-neutral-300 md:text-base">
        {children}
      </div>
    </section>
  );
}