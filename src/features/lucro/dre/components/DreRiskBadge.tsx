"use client";

import { useEffect, useState } from "react";

type Dre = {
  receitaTotal: number;
  custoProdutos: number;
  taxas: number;
  logistica: number;
  lucro: number;
  margem: number;
};

type ApiData = {
  score: number;
  status: "OK" | "ATENCAO" | "RISCO" | "PREJUIZO";
  flags: string[];
  metrics: {
    taxa_percent: number;
    logistica_percent: number;
    custo_percent: number;
    margem_percent: number;
  };
  actions: string[];
  summary: string;
};

type RiskTone = "ok" | "warn" | "risk" | "danger";

function statusMeta(status: ApiData["status"]): {
  label: string;
  chip: string;
  tone: RiskTone;
  icon: string;
} {
  if (status === "OK") {
    return {
      label: "Operação saudável",
      chip: "OK",
      tone: "ok",
      icon: "✅",
    };
  }

  if (status === "ATENCAO") {
    return {
      label: "Ponto de atenção",
      chip: "Atenção",
      tone: "warn",
      icon: "⚠️",
    };
  }

  if (status === "RISCO") {
    return {
      label: "Risco elevado",
      chip: "Risco",
      tone: "risk",
      icon: "🚨",
    };
  }

  return {
    label: "Prejuízo detectado",
    chip: "Prejuízo",
    tone: "danger",
    icon: "🛑",
  };
}

function chipClassName(tone: RiskTone) {
  if (tone === "ok") return "chip ok";
  if (tone === "warn") return "chip";
  return "chip risk";
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: RiskTone;
}) {
  return (
    <div className={`risk-metric ${tone ?? ""}`}>
      <div className="risk-metric-label">{label}</div>
      <div className="risk-metric-value">{value}</div>
    </div>
  );
}

export default function DreRiskBadge({ dre }: { dre: Dre }) {
  const [data, setData] = useState<ApiData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setErr(null);

        const r = await fetch("/api/ai/dre-risk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dre }),
        });

        const j = await r.json().catch(() => null);

        if (!r.ok) {
          throw new Error(j?.message ?? "Falha ao calcular risco.");
        }

        if (!alive) return;
        setData(j.data);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Erro ao analisar risco.";
        if (alive) setErr(msg);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [dre]);

  if (err) {
    return (
      <div className="risk-card danger">
        <div className="risk-head">
          <div>
            <div className="risk-kicker">Não foi possível concluir a leitura</div>
            <div className="risk-summary">{err}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="risk-card">
        <div className="risk-head">
          <div>
            <div className="risk-kicker">Leitura da operação</div>
            <div className="risk-summary">Analisando risco e pressão sobre a margem...</div>
          </div>
        </div>

        <div className="risk-loading">
          <div className="risk-loading-bar" />
          <div className="risk-loading-bar short" />
        </div>
      </div>
    );
  }

  const meta = statusMeta(data.status);

  return (
    <div className={`risk-card ${meta.tone}`}>
      <div className="risk-head">
        <div className="risk-main">
          <div className="risk-top">
            <span className={chipClassName(meta.tone)}>
              <span>{meta.icon}</span>
              <span>{meta.chip}</span>
            </span>
          </div>

          <div className="risk-title">{meta.label}</div>
          <div className="risk-summary">{data.summary}</div>
        </div>

        <div className="risk-score-wrap">
          <div className="risk-score-label">Score</div>
          <div className="risk-score-value">{data.score}/100</div>
        </div>
      </div>

      <div className="risk-metrics">
        <Metric label="Taxa" value={`${data.metrics.taxa_percent}%`} tone={meta.tone} />
        <Metric label="Logística" value={`${data.metrics.logistica_percent}%`} tone={meta.tone} />
        <Metric label="Custo" value={`${data.metrics.custo_percent}%`} tone={meta.tone} />
        <Metric label="Margem" value={`${data.metrics.margem_percent}%`} tone={meta.tone} />
      </div>

      {data.actions?.length > 0 && (
        <div className="risk-actions">
          <div className="risk-actions-title">Ações recomendadas</div>
          <ul className="risk-actions-list">
            {data.actions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}



