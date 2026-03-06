"use client";

import { useState } from "react";

type Dre = {
  receitaTotal: number;
  custoProdutos: number;
  taxas: number;
  logistica: number;
  lucro: number;
  margem: number;
};

type AiResult = {
  summary: string;
  insights: string[];
  warnings: string[];
  actions: string[];
  targets?: { margem_alvo_percent?: number; taxas_alvo_percent?: number };
};

function Block({
  title,
  items,
  tone = "neutral",
}: {
  title: string;
  items?: string[];
  tone?: "neutral" | "warn" | "good";
}) {
  if (!items?.length) return null;

  return (
    <div className={`aii-block ${tone}`}>
      <div className="aii-block-title">{title}</div>
      <ul className="aii-list">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function DreInsightsAI({
  dre,
  simulacaoId,
}: {
  dre: Dre;
  simulacaoId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AiResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setErr(null);
    setLoading(true);

    try {
      const r = await fetch("/api/ai/dre-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dre, simulacao_id: simulacaoId ?? null }),
      });

      const j = await r.json().catch(() => null);

      if (!r.ok) {
        if (j?.code === "LIMIT_DAILY") {
          setErr("Você atingiu o limite diário de IA no plano Free. Assine o Pro para liberar.");
          return;
        }
        setErr(j?.message ?? "Erro ao gerar insights");
        return;
      }

      setData(j.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="ai-card aii-card">
      <div className="ai-head">
        <div>
          <h3 className="ai-title">Insights com IA</h3>
          <p className="ai-desc">
            Resumo automático do seu DRE com ações práticas para melhorar margem,
            reduzir risco e ganhar competitividade.
          </p>
        </div>

        <span className="chip pro">IA</span>
      </div>

      <div className="ai-body">
        <div className="ai-actions">
          <button onClick={run} disabled={loading} className="btn btn-primary">
            {loading ? "Gerando..." : "Gerar Insights"}
          </button>
        </div>

        {loading && (
          <div className="aii-loading">
            <div className="aii-loading-bar" />
            <div className="aii-loading-bar short" />
          </div>
        )}

        {err && (
          <div className="ai-result aii-error">
            <h4>Erro ao gerar insights</h4>
            <p>{err}</p>
          </div>
        )}

        {data && (
          <div className="aii-content">
            <div className="aii-summary">
              <div className="aii-summary-kicker">Resumo executivo</div>
              <div className="aii-summary-text">{data.summary}</div>
            </div>

            <div className="aii-grid">
              <Block title="Alertas" items={data.warnings} tone="warn" />
              <Block title="Insights" items={data.insights} tone="neutral" />
              <Block title="Ações recomendadas" items={data.actions} tone="good" />
            </div>

            {data.targets && (
              <div className="aii-targets">
                <span className="chip">Meta de margem: {data.targets.margem_alvo_percent ?? "-"}%</span>
                <span className="chip">Meta de taxas: {data.targets.taxas_alvo_percent ?? "-"}%</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}