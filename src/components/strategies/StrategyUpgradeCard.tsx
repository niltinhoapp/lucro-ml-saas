type Props = {
  onUpgrade?: () => void;
};

export default function StrategyUpgradeCard({ onUpgrade }: Props) {
  return (
    <section className="p-6 border rounded-3xl border-amber-400/20 bg-gradient-to-br from-amber-400/10 via-neutral-900 to-neutral-900">
      <div className="max-w-2xl">
        <p className="inline-flex px-3 py-1 text-xs font-medium border rounded-full border-amber-400/30 bg-amber-400/10 text-amber-300">
          Exclusivo para Plus
        </p>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white md:text-3xl">
          Desbloqueie a Central de Estratégias ML
        </h1>

        <p className="mt-3 text-sm leading-7 text-neutral-300 md:text-base">
          Receba estratégias práticas para aplicar no Mercado Livre, com foco em
          margem, promoções, posicionamento, ranking e crescimento da operação.
        </p>

        <div className="grid gap-3 mt-5 md:grid-cols-2">
          <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
            <p className="text-sm font-semibold text-white">
              O que você desbloqueia no Pro
            </p>
            <ul className="mt-3 space-y-2 text-sm text-neutral-300">
              <li>• Estratégias semanais aplicáveis</li>
              <li>• Notificações de novas dicas</li>
              <li>• Biblioteca completa de estratégias</li>
              <li>• Técnicas avançadas de operação no ML</li>
            </ul>
          </div>

          <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
            <p className="text-sm font-semibold text-white">
              Ideal para sellers que querem
            </p>
            <ul className="mt-3 space-y-2 text-sm text-neutral-300">
              <li>• Melhorar margem</li>
              <li>• Aproveitar promoções com inteligência</li>
              <li>• Evoluir posicionamento</li>
              <li>• Tomar decisões mais estratégicas</li>
            </ul>
          </div>
        </div>

        <button
          onClick={onUpgrade}
          className="px-5 py-3 mt-6 text-sm font-semibold transition rounded-2xl bg-amber-400 text-neutral-950 hover:opacity-90"
        >
          Fazer upgrade para Pro
        </button>
      </div>
    </section>
  );
}



