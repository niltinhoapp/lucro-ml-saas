"use client";

import { useMemo, useState } from "react";

type ModeResult = {
  taxa_percent: number; // em %
  taxas_valor: number;
  logistica: number;
  extra_custos: number;
  lucro: number;
  margem: number; // em %
};

type ApiData = {
  receita_total: number;
  custo_produtos: number;
  full: ModeResult;
  flex: ModeResult;
  recomendacao: "FULL" | "FLEX" | "INDIFERENTE";
  motivo: string;
  warnings: string[];
};

function money(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function clampPct(x: number) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(99.99, x));
}

function RecBadge({ rec }: { rec: ApiData["recomendacao"] }) {
  const meta =
    rec === "FULL"
      ? { cls: "ui-badge ui-badge-blue", text: "FULL recomendado" }
      : rec === "FLEX"
      ? { cls: "ui-badge ui-badge-green", text: "FLEX recomendado" }
      : { cls: "ui-badge ui-badge-gray", text: "Indiferente" };

  return <span className={meta.cls}>{meta.text}</span>;
}

function KPI({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "bad" | "info";
}) {
  const cls =
    tone === "good"
      ? "ui-kpi good"
      : tone === "bad"
      ? "ui-kpi bad"
      : tone === "info"
      ? "ui-kpi info"
      : "ui-kpi";
  return (
    <div className={cls}>
      <div className="ui-kpi-label">{label}</div>
      <div className="ui-kpi-value">{value}</div>
    </div>
  );
}

function ModeCard(props: {
  title: "FULL" | "FLEX";
  subtitle: string;
  taxaPct: number;
  setTaxaPct: (v: number) => void;
  log: number;
  setLog: (v: number) => void;
  extra: number;
  setExtra: (v: number) => void;
  result?: ModeResult | null;
}) {
  const { title, subtitle, taxaPct, setTaxaPct, log, setLog, extra, setExtra, result } = props;

  const lucroTone =
    (result?.lucro ?? 0) > 0 ? "good" : (result?.lucro ?? 0) < 0 ? "bad" : "neutral";

  return (
    <section className="ui-subcard">
      <div className="ui-subhead">
        <div className="ui-subtitle-row">
          <div className="ui-subtitle">{title}</div>
          <span className={`ui-pill ${title === "FULL" ? "ui-pill-blue" : "ui-pill-green"}`}>
            {title}
          </span>
        </div>
        <div className="ui-subdesc">{subtitle}</div>
      </div>

      <div className="ui-form-grid">
        <label className="ui-field">
          <span className="ui-label">Taxa (%)</span>
          <input
            className="ui-input"
            type="number"
            step="0.01"
            value={taxaPct}
            onChange={(e) => setTaxaPct(clampPct(Number(e.target.value)))}
          />
        </label>

        <label className="ui-field">
          <span className="ui-label">Logística (R$)</span>
          <input
            className="ui-input"
            type="number"
            step="0.01"
            value={log}
            onChange={(e) => setLog(Number(e.target.value) || 0)}
          />
        </label>

        <label className="ui-field ui-field-span2">
          <span className="ui-label">Extra custos (R$) (opcional)</span>
          <input
            className="ui-input"
            type="number"
            step="0.01"
            value={extra}
            onChange={(e) => setExtra(Number(e.target.value) || 0)}
          />
        </label>
      </div>

      {result ? (
        <div className="ui-kpis">
          <KPI label="Lucro" value={money(result.lucro)} tone={lucroTone} />
          <KPI label="Margem" value={`${result.margem.toFixed(2)}%`} tone={result.margem >= 15 ? "good" : result.margem < 8 ? "bad" : "neutral"} />
          <KPI label="Taxas" value={money(result.taxas_valor)} tone="info" />
        </div>
      ) : (
        <div className="ui-hint">Preencha e clique em <b>Comparar</b> para ver o resultado.</div>
      )}
    </section>
  );
}

export default function FullVsFlexAI(props: {
  receitaTotal: number;
  custoProdutos: number;
  fullTaxaDefault?: number; // fração, ex 0.16
  flexTaxaDefault?: number; // fração
  fullLogisticaDefault?: number;
  flexLogisticaDefault?: number;
}) {
  const {
    receitaTotal,
    custoProdutos,
    fullTaxaDefault = 0.16,
    flexTaxaDefault = 0.16,
    fullLogisticaDefault = 0,
    flexLogisticaDefault = 0,
  } = props;

  const [fullTaxaPct, setFullTaxaPct] = useState<number>(Number((fullTaxaDefault * 100).toFixed(2)));
  const [flexTaxaPct, setFlexTaxaPct] = useState<number>(Number((flexTaxaDefault * 100).toFixed(2)));
  const [fullLog, setFullLog] = useState<number>(Number(fullLogisticaDefault || 0));
  const [flexLog, setFlexLog] = useState<number>(Number(flexLogisticaDefault || 0));
  const [fullExtra, setFullExtra] = useState<number>(0);
  const [flexExtra, setFlexExtra] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ApiData | null>(null);

  const receitaFmt = useMemo(() => money(receitaTotal), [receitaTotal]);
  const custoFmt = useMemo(() => money(custoProdutos), [custoProdutos]);

  async function calcular() {
    setErr(null);
    setLoading(true);
    setData(null);

    try {
      const payload = {
        receita_total: Number(receitaTotal) || 0,
        custo_produtos: Number(custoProdutos) || 0,
        full: {
          taxa_percent: (Number(fullTaxaPct) || 0) / 100,
          logistica: Number(fullLog) || 0,
          extra_custos: Number(fullExtra) || 0,
        },
        flex: {
          taxa_percent: (Number(flexTaxaPct) || 0) / 100,
          logistica: Number(flexLog) || 0,
          extra_custos: Number(flexExtra) || 0,
        },
      };

      const r = await fetch("/api/ai/full-vs-flex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await r.json().catch(() => null);
      if (!r.ok) {
        setErr(j?.message ?? "Erro ao calcular Full vs Flex");
        return;
      }

      setData(j.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ui-card">
      <div className="ui-card-head">
        <div className="ui-card-copy">
          <h3 className="ui-card-title">Full vs Flex</h3>
          <p className="ui-card-sub">
            Compare lucro e margem nos dois modos e receba uma recomendação baseada nos seus números.
          </p>
          <div className="ui-meta">
            Base: <b>Receita</b> {receitaFmt} • <b>Custo</b> {custoFmt}
          </div>
        </div>

        <button onClick={calcular} disabled={loading} className="ui-btn ui-btn-primary">
          {loading ? "Comparando..." : "Comparar"}
        </button>
      </div>

      <div className="ui-2col">
        <ModeCard
          title="FULL"
          subtitle="Quando o ML cuida do estoque/envio. Foque em taxa e custo logístico real."
          taxaPct={fullTaxaPct}
          setTaxaPct={setFullTaxaPct}
          log={fullLog}
          setLog={setFullLog}
          extra={fullExtra}
          setExtra={setFullExtra}
          result={data?.full ?? null}
        />

        <ModeCard
          title="FLEX"
          subtitle="Você controla o envio. Otimize peso/medidas e custo por pedido."
          taxaPct={flexTaxaPct}
          setTaxaPct={setFlexTaxaPct}
          log={flexLog}
          setLog={setFlexLog}
          extra={flexExtra}
          setExtra={setFlexExtra}
          result={data?.flex ?? null}
        />
      </div>

      {err ? (
        <div className="ui-alert ui-alert-danger">{err}</div>
      ) : null}

      {data ? (
        <div className="ui-rec">
          <div className="ui-rec-head">
            <RecBadge rec={data.recomendacao} />
            <div className="ui-rec-title">
              Recomendação:{" "}
              <b>{data.recomendacao === "INDIFERENTE" ? "Tanto faz" : data.recomendacao}</b>
            </div>
          </div>

          <div className="ui-rec-body">{data.motivo}</div>

          {data.warnings?.length ? (
            <ul className="ui-warn">
              {data.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}



