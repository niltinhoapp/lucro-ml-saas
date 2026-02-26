import { DreInsight } from "@/lib/dre/insights";

const styles: Record<DreInsight["level"], string> = {
  success: "border-green-200 bg-green-50 text-green-900",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-900",
  danger: "border-red-200 bg-red-50 text-red-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
};

export default function DreInsights({ insights }: { insights: DreInsight[] }) {
  if (!insights?.length) return null;

  return (
    <section className="space-y-3">
      <div className="insights-head">
        <h2 className="text-lg font-semibold text-gray-800">
          Insights automáticos
        </h2>
        <span className="text-xs text-gray-500">análise baseada no seu DRE</span>
      </div>

      <div className="grid gap-3">
        {insights.map((it, idx) => (
          <div key={idx} className={`border rounded-xl p-4 ${styles[it.level]}`}>
            <div className="font-semibold">{it.title}</div>
            <div className="text-sm opacity-90 mt-1">{it.detail}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
