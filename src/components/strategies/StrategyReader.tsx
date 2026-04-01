import type { ReactNode } from "react";
import type { Strategy } from "@/types/strategy";

type Props = {
  strategy: Strategy | null;
  onMarkAsRead: (id: string) => void;
};

export default function StrategyReader({ strategy, onMarkAsRead }: Props) {
  if (!strategy) {
    return (
      <div className="p-10 text-center border border-dashed rounded-2xl border-white/10 text-neutral-400">
        Selecione uma estratégia para visualizar.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 text-xs font-medium border rounded-full border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
              {strategy.category}
            </span>

            <span className="text-xs text-neutral-400">
              Leitura: {strategy.readTime}
            </span>
          </div>

          <h2 className="text-2xl font-bold">{strategy.title}</h2>

          <p className="max-w-3xl mt-3 text-sm leading-6 text-neutral-300 md:text-base">
            {strategy.summary}
          </p>
        </div>

        {!strategy.isRead && (
          <button
            onClick={() => onMarkAsRead(strategy.id)}
            className="px-4 py-3 text-sm font-semibold transition border rounded-2xl border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/15"
          >
            Marcar como lida
          </button>
        )}
      </div>

      <div className="grid gap-4">
        <SectionCard title="O que é">{strategy.content.oQueE}</SectionCard>
        <SectionCard title="Como funciona">
          {strategy.content.comoFunciona}
        </SectionCard>
        <SectionCard title="Exemplo prático">
          {strategy.content.exemplo}
        </SectionCard>
        <SectionCard title="Quando usar">
          {strategy.content.quandoUsar}
        </SectionCard>
        <SectionCard title="Erro comum">
          {strategy.content.erroComum}
        </SectionCard>
        <SectionCard title="Ação prática da semana" highlight>
          {strategy.content.acaoDaSemana}
        </SectionCard>
      </div>
    </>
  );
}

function SectionCard({
  title,
  children,
  highlight = false,
}: {
  title: string;
  children: ReactNode;
  highlight?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border p-4 md:p-5 ${
        highlight
          ? "border-amber-400/20 bg-amber-400/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <h3 className="mb-2 text-sm font-semibold tracking-wide uppercase text-neutral-200">
        {title}
      </h3>

      <p className="text-sm leading-7 text-neutral-300 md:text-base">
        {children}
      </p>
    </section>
  );
}



