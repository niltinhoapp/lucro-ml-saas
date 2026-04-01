"use client";

import { useEffect, useMemo, useState } from "react";
import ProUpgradeButton from "@/components/pro/ProUpgradeButton";

type HiddenLossResponse = {
  score: number;
  status: string;
  lucro: number;
  margem: number;
  recomendacaoPreco: number;
  conclusao: string;
  alertas: string[];
  perdas: Array<{ item: string; valor: number; nivel: string }>;
  acoes: string[];
};

type FormState = {
  produto: string;
  precoVenda: string;
  custoProduto: string;
  frete: string;
  taxaPercent: string;
  devolucaoPercent: string;
  adsPercent: string;
};

const initialForm: FormState = {
  produto: "mini projetor portátil",
  precoVenda: "249.9",
  custoProduto: "109.9",
  frete: "24",
  taxaPercent: "16",
  devolucaoPercent: "3",
  adsPercent: "6",
};

function getScoreTone(score: number) {
  if (score >= 75) return "good";
  if (score >= 50) return "info";
  if (score >= 30) return "warn";
  return "danger";
}

function getBadgeClass(scoreTone: string) {
  if (scoreTone === "good") return "ok";
  if (scoreTone === "info") return "pro";
  if (scoreTone === "warn") return "bad";
  return "bad";
}

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatLabel(key: keyof FormState) {
  const labels: Record<keyof FormState, string> = {
    produto: "Produto",
    precoVenda: "Preço de venda",
    custoProduto: "Custo do produto",
    frete: "Frete",
    taxaPercent: "Taxa (%)",
    devolucaoPercent: "Devolução (%)",
    adsPercent: "Ads (%)",
  };

  return labels[key];
}

export default function DiagnosticoLucroClient() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [data, setData] = useState<HiddenLossResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scoreTone = useMemo(() => {
    if (!data) return "info";
    return getScoreTone(data.score);
  }, [data]);

  async function analisar() {
    setLoading(true);
    setError(null);

    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [
          key,
          key === "produto" ? value : Number(value),
        ])
      );

      const res = await fetch("/api/ai/hidden-loss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Não foi possível analisar agora.");
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao analisar.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    analisar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="market-page page-wrap">
      <section className="seller-hero seller-hero-diagnostic exec-hero">
        <div className="exec-hero-top">
          <div className="exec-hero-copy">
            <span className="badge pro">Diagnóstico</span>

            <h1 className="exec-title">Analisar lucro</h1>

            <p className="exec-subtitle">
              Preencha os dados e veja lucro, margem e preço recomendado.
            </p>

            <div className="exec-hero-proof">
              <span className="pill good">Lucro</span>
              <span className="pill">Margem</span>
              <span className="pill">Preço</span>
            </div>
          </div>

          <div className="seller-form-card exec-form-card">
            <div className="exec-form-grid">
              {(Object.keys(form) as Array<keyof FormState>).map((key) => (
                <div
                  key={key}
                  className={key === "produto" ? "exec-field exec-field-full" : "exec-field"}
                >
                  <label className="market-label">{formatLabel(key)}</label>

                  <input
                    className="market-input"
                    value={form[key]}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    placeholder={formatLabel(key)}
                  />
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary btn-big"
              type="button"
              onClick={analisar}
              disabled={loading}
            >
              {loading ? "Analisando..." : "Analisar"}
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <section className="card card-premium dre-error">
          <div className="dre-error-kicker">Não foi possível analisar</div>
          <p className="subtitle" style={{ marginTop: 10 }}>
            {error}
          </p>
        </section>
      ) : null}

      {data ? (
        <>
          <section className="diagnostic-score-card card card-premium">
            <div className="card-head">
              <div className="min-w-0">
                <h2>Resultado</h2>
              </div>

              <span className={`badge ${getBadgeClass(scoreTone)}`}>
                {data.status}
              </span>
            </div>

            <div className="diagnostic-score-grid">
              <div className={`diagnostic-score-main tone-${scoreTone}`}>
                <div className="diagnostic-score-label">Score</div>
                <div className="diagnostic-score-value">{data.score}/100</div>

                <div className="diagnostic-score-bar">
                  <div
                    className={`diagnostic-score-bar-fill tone-${scoreTone}`}
                    style={{ width: `${Math.max(0, Math.min(100, data.score))}%` }}
                  />
                </div>

                <p className="diagnostic-score-text">{data.conclusao}</p>
              </div>

              <div className="exec-kpi-grid diagnostic-kpis">
                <div className="exec-kpi-card">
                  <div className="market-kpi-label">Lucro</div>
                  <div className="exec-kpi-value">{formatMoney(data.lucro)}</div>
                </div>

                <div className="exec-kpi-card">
                  <div className="market-kpi-label">Margem</div>
                  <div className="exec-kpi-value">{data.margem.toFixed(2)}%</div>
                </div>

                <div className="exec-kpi-card tone-info">
                  <div className="market-kpi-label">Preço recomendado</div>
                  <div className="exec-kpi-value">
                    {formatMoney(data.recomendacaoPreco)}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="market-grid-2">
            <div className="card card-premium exec-section-card">
              <div className="card-head">
                <div className="min-w-0">
                  <h2>Perdas</h2>
                </div>

                <span className={`badge ${getBadgeClass(scoreTone)}`}>
                  {data.status}
                </span>
              </div>

              <div className="diagnostic-loss-list">
                {data.perdas.map((item) => (
                  <div className="diagnostic-loss-item" key={item.item}>
                    <div className="diagnostic-loss-copy">
                      <div className="diagnostic-loss-title">{item.item}</div>
                      <div className="diagnostic-loss-meta">{item.nivel}</div>
                    </div>

                    <div className="diagnostic-loss-value">
                      {formatMoney(item.valor)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card card-premium exec-section-card">
              <div className="card-head">
                <div className="min-w-0">
                  <h2>Atenção</h2>
                </div>
              </div>

              <div className="market-summary-list">
                {data.alertas.map((item) => (
                  <div key={`alerta-${item}`} className="alert danger">
                    {item}
                  </div>
                ))}

                {data.acoes.map((item) => (
                  <div key={`acao-${item}`} className="alert success">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <ProUpgradeButton
            title="Libere mais recursos"
            subtitle="Faça upgrade para continuar."
          />
        </>
      ) : null}
    </div>
  );
}

