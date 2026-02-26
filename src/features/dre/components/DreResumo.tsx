"use client";

import type { DreResultado } from "@/lib/dre/insights";

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pct(value: number) {
  return `${value.toFixed(2)}%`;
}

function Badge({ level, text }: { level: "success" | "warning" | "danger"; text: string }) {
  const cls =
    level === "success"
      ? "bg-green-50 text-green-700 border-green-200"
      : level === "warning"
      ? "bg-yellow-50 text-yellow-800 border-yellow-200"
      : "bg-red-50 text-red-700 border-red-200";

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${cls}`}>
      <span className="inline-block h-2 w-2 rounded-full bg-current opacity-70" />
      {text}
    </span>
  );
}

function DeltaRow({ label, value, accent }: { label: string; value: string; accent?: "green" | "red" | "blue" }) {
  const color =
    accent === "green" ? "text-green-700" : accent === "red" ? "text-red-600" : accent === "blue" ? "text-blue-700" : "text-gray-900";

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
  accent,
}: {
  title: string;
  value: string;
  hint?: string;
  accent?: "green" | "red" | "blue" | "gray";
}) {
  const ring =
    accent === "green"
      ? "ring-green-100"
      : accent === "red"
      ? "ring-red-100"
      : accent === "blue"
      ? "ring-blue-100"
      : "ring-gray-100";

  return (
    <div className={`bg-white rounded-2xl shadow-sm ring-1 ${ring} p-5`}>
      <div className="text-xs font-semibold text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
      {hint ? <div className="mt-2 text-xs text-gray-500">{hint}</div> : null}
    </div>
  );
}

export default function DreResumo({ dre }: { dre: DreResultado }) {
  const status =
    dre.lucro < 0
      ? { level: "danger" as const, text: "Prejuízo" }
      : dre.margem < 8
      ? { level: "warning" as const, text: "Margem baixa" }
      : dre.margem < 15
      ? { level: "warning" as const, text: "Margem ok" }
      : { level: "success" as const, text: "Saudável" };

  // participação na receita
  const receita = dre.receitaTotal || 0;
  const pCusto = receita ? (dre.custoProdutos / receita) * 100 : 0;
  const pTaxas = receita ? (dre.taxas / receita) * 100 : 0;
  const pLog = receita ? (dre.logistica / receita) * 100 : 0;

  // “o que mais pesa”
  const top =
    Math.max(dre.custoProdutos, dre.taxas, dre.logistica) === dre.custoProdutos
      ? { name: "Custo do produto", pct: pCusto }
      : Math.max(dre.custoProdutos, dre.taxas, dre.logistica) === dre.taxas
      ? { name: "Taxas ML", pct: pTaxas }
      : { name: "Logística", pct: pLog };

  return (
    <section className="space-y-6">
      {/* Header do bloco */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Resumo do DRE</h2>
          <p className="text-sm text-gray-500">
            Visão executiva (receita, custos, taxas, logística e lucro)
          </p>
        </div>

        <Badge level={status.level} text={status.text} />
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Receita total" value={brl(dre.receitaTotal)} hint="Total vendido no período" accent="blue" />
        <StatCard title="Custos (produtos)" value={brl(dre.custoProdutos)} hint={`${pCusto.toFixed(1)}% da receita`} />
        <StatCard title="Taxas + logística" value={brl(dre.taxas + dre.logistica)} hint={`${(pTaxas + pLog).toFixed(1)}% da receita`} />
        <StatCard
          title="Lucro"
          value={brl(dre.lucro)}
          hint={`Margem: ${pct(dre.margem)}`}
          accent={dre.lucro >= 0 ? "green" : "red"}
        />
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Detalhamento</h3>
            <span className="text-xs text-gray-500">por componentes</span>
          </div>

          <div className="mt-4">
            <DeltaRow label="Custo do produto" value={`${brl(dre.custoProdutos)} (${pCusto.toFixed(1)}%)`} />
            <DeltaRow label="Taxas ML" value={`${brl(dre.taxas)} (${pTaxas.toFixed(1)}%)`} />
            <DeltaRow label="Logística" value={`${brl(dre.logistica)} (${pLog.toFixed(1)}%)`} />
            <DeltaRow
              label="Lucro"
              value={`${brl(dre.lucro)} (${pct(dre.margem)})`}
              accent={dre.lucro >= 0 ? "green" : "red"}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5">
          <h3 className="font-semibold text-gray-900">Leitura rápida</h3>
          <p className="text-sm text-gray-500 mt-1">
            O que está mais pesando na operação neste cenário.
          </p>

          <div className="mt-4 rounded-xl border border-gray-200 p-4">
            <div className="text-xs font-semibold text-gray-500">Maior impacto</div>
            <div className="mt-1 text-lg font-bold text-gray-900">{top.name}</div>
            <div className="mt-2 text-sm text-gray-600">
              Representa <span className="font-semibold">{top.pct.toFixed(1)}%</span> da receita.
            </div>

            <div className="mt-4 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-gray-900/70"
                style={{ width: `${Math.min(100, Math.max(0, top.pct))}%` }}
              />
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Dica: se isso estiver alto, foque em otimizar antes de aumentar Ads/volume.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
