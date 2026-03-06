"use client";

import type { DreResultado } from "@/lib/dre/insights";

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function pct(value: number) {
  return `${value.toFixed(2)}%`;
}

function StatusBadge({ level, text }: { level: "success" | "warning" | "danger"; text: string }) {
  const cls =
    level === "success"
      ? "badge ok"
      : level === "warning"
      ? "badge"
      : "badge bad";

  return (
    <span className={cls}>
      <span className="dre-dot" />
      {text}
    </span>
  );
}

function StatCard({
  title,
  value,
  hint,
  tone,
}: {
  title: string;
  value: string;
  hint?: string;
  tone?: "green" | "red" | "blue" | "gray";
}) {
  const toneCls =
    tone === "green" ? "dre-stat green" : tone === "red" ? "dre-stat red" : tone === "blue" ? "dre-stat blue" : "dre-stat";

  return (
    <div className={toneCls}>
      <div className="dre-stat-top">
        <div className="dre-stat-title">{title}</div>
        <div className="dre-stat-chip">{tone === "green" ? "▲" : tone === "red" ? "▼" : "•"}</div>
      </div>

      <div className="dre-stat-value">{value}</div>
      {hint ? <div className="dre-stat-hint">{hint}</div> : null}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "green" | "red" | "blue" }) {
  const t = tone ? `dre-row-value ${tone}` : "dre-row-value";
  return (
    <div className="dre-row">
      <div className="dre-row-label">{label}</div>
      <div className={t}>{value}</div>
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

  const receita = dre.receitaTotal || 0;
  const pCusto = receita ? (dre.custoProdutos / receita) * 100 : 0;
  const pTaxas = receita ? (dre.taxas / receita) * 100 : 0;
  const pLog = receita ? (dre.logistica / receita) * 100 : 0;

  const top =
    Math.max(dre.custoProdutos, dre.taxas, dre.logistica) === dre.custoProdutos
      ? { name: "Custo do produto", pct: pCusto }
      : Math.max(dre.custoProdutos, dre.taxas, dre.logistica) === dre.taxas
      ? { name: "Taxas ML", pct: pTaxas }
      : { name: "Logística", pct: pLog };

  return (
    <section className="dre-resumo">
      {/* Header */}
      <div className="dre-head">
        <div className="dre-head-left">
          <h2 className="dre-title">Resumo do DRE</h2>
          <p className="dre-subtitle">Visão executiva (receita, custos, taxas, logística e lucro)</p>
        </div>

        <StatusBadge level={status.level} text={status.text} />
      </div>

      {/* KPI cards */}
      <div className="dre-kpis">
        <StatCard title="Receita total" value={brl(dre.receitaTotal)} hint="Total vendido no período" tone="blue" />
        <StatCard title="Custos (produtos)" value={brl(dre.custoProdutos)} hint={`${pCusto.toFixed(1)}% da receita`} />
        <StatCard title="Taxas + logística" value={brl(dre.taxas + dre.logistica)} hint={`${(pTaxas + pLog).toFixed(1)}% da receita`} />
        <StatCard title="Lucro" value={brl(dre.lucro)} hint={`Margem: ${pct(dre.margem)}`} tone={dre.lucro >= 0 ? "green" : "red"} />
      </div>

      {/* Breakdown */}
      <div className="dre-panels">
        <div className="card card-pad">
          <div className="dre-panel-head">
            <h3 className="dre-h3">Detalhamento</h3>
            <span className="dre-meta">por componentes</span>
          </div>

          <div className="dre-rows">
            <Row label="Custo do produto" value={`${brl(dre.custoProdutos)} (${pCusto.toFixed(1)}%)`} />
            <Row label="Taxas ML" value={`${brl(dre.taxas)} (${pTaxas.toFixed(1)}%)`} />
            <Row label="Logística" value={`${brl(dre.logistica)} (${pLog.toFixed(1)}%)`} />
            <Row label="Lucro" value={`${brl(dre.lucro)} (${pct(dre.margem)})`} tone={dre.lucro >= 0 ? "green" : "red"} />
          </div>
        </div>

        <div className="card card-pad">
          <div className="dre-panel-head">
            <h3 className="dre-h3">Leitura rápida</h3>
            <span className="dre-meta">impacto na receita</span>
          </div>

          <div className="dre-quick">
            <div className="dre-quick-kicker">Maior impacto</div>
            <div className="dre-quick-title">{top.name}</div>
            <div className="dre-quick-desc">
              Representa <span className="dre-strong">{top.pct.toFixed(1)}%</span> da receita.
            </div>

            <div className="dre-bar">
              <div className="dre-bar-fill" style={{ width: `${Math.min(100, Math.max(0, top.pct))}%` }} />
            </div>

            <div className="dre-tip">
              Dica: se isso estiver alto, otimize antes de aumentar Ads/volume.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}