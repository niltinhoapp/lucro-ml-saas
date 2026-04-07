"use client";

import { useEffect, useMemo, useState } from "react";
import ProUpgradeButton from "@/features/dashboard/shared/pro/ProUpgradeButton";

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
  if (scoreTone === "info") return "info";
  if (scoreTone === "warn") return "warn";
  return "danger";
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
    <div className="lm-diagnostic-page">
      <section className="lm-diagnostic-hero">
        <div className="lm-diagnostic-hero__content">
          <div className="lm-diagnostic-hero__top">
            <div>
              <span className="lm-diagnostic-chip">Diagnóstico</span>

              <h1 className="lm-diagnostic-title">Analisar lucro</h1>

              <p className="lm-diagnostic-subtitle">
                Preencha os dados e veja lucro, margem, perdas ocultas e preço
                recomendado para decidir com mais segurança.
              </p>

              <div className="lm-diagnostic-proof">
                <span>Lucro real</span>
                <span>Margem</span>
                <span>Preço recomendado</span>
              </div>
            </div>

            <div className="lm-diagnostic-form-card">
              <div className="lm-diagnostic-form-grid">
                {(Object.keys(form) as Array<keyof FormState>).map((key) => (
                  <div
                    key={key}
                    className={
                      key === "produto"
                        ? "lm-diagnostic-field lm-diagnostic-field--full"
                        : "lm-diagnostic-field"
                    }
                  >
                    <label className="lm-diagnostic-label">
                      {formatLabel(key)}
                    </label>

                    <input
                      className="lm-diagnostic-input"
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
                className="lm-diagnostic-submit"
                type="button"
                onClick={analisar}
                disabled={loading}
              >
                {loading ? "Analisando..." : "Analisar"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <section className="lm-diagnostic-error">
          <div className="lm-diagnostic-error__kicker">
            Não foi possível analisar
          </div>
          <p>{error}</p>
        </section>
      ) : null}

      {data ? (
        <>
          <section className="lm-diagnostic-result-card">
            <div className="lm-diagnostic-card-head">
              <h2>Resultado</h2>

              <span
                className={`lm-diagnostic-status-badge ${getBadgeClass(
                  scoreTone
                )}`}
              >
                {data.status}
              </span>
            </div>

            <div className="lm-diagnostic-result-grid">
              <div className={`lm-diagnostic-score-main tone-${scoreTone}`}>
                <div className="lm-diagnostic-score-label">Score</div>
                <div className="lm-diagnostic-score-value">{data.score}/100</div>

                <div className="lm-diagnostic-score-bar">
                  <div
                    className={`lm-diagnostic-score-bar-fill tone-${scoreTone}`}
                    style={{ width: `${Math.max(0, Math.min(100, data.score))}%` }}
                  />
                </div>

                <p className="lm-diagnostic-score-text">{data.conclusao}</p>
              </div>

              <div className="lm-diagnostic-kpi-grid">
                <div className="lm-diagnostic-kpi-card">
                  <div className="lm-diagnostic-kpi-label">Lucro</div>
                  <div className="lm-diagnostic-kpi-value">
                    {formatMoney(data.lucro)}
                  </div>
                </div>

                <div className="lm-diagnostic-kpi-card">
                  <div className="lm-diagnostic-kpi-label">Margem</div>
                  <div className="lm-diagnostic-kpi-value">
                    {data.margem.toFixed(2)}%
                  </div>
                </div>

                <div className="lm-diagnostic-kpi-card tone-info">
                  <div className="lm-diagnostic-kpi-label">
                    Preço recomendado
                  </div>
                  <div className="lm-diagnostic-kpi-value">
                    {formatMoney(data.recomendacaoPreco)}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="lm-diagnostic-bottom-grid">
            <div className="lm-diagnostic-section-card">
              <div className="lm-diagnostic-card-head">
                <h2>Perdas</h2>

                <span
                  className={`lm-diagnostic-status-badge ${getBadgeClass(
                    scoreTone
                  )}`}
                >
                  {data.status}
                </span>
              </div>

              <div className="lm-diagnostic-loss-list">
                {data.perdas.map((item) => (
                  <div className="lm-diagnostic-loss-item" key={item.item}>
                    <div className="lm-diagnostic-loss-copy">
                      <div className="lm-diagnostic-loss-title">{item.item}</div>
                      <div className="lm-diagnostic-loss-meta">{item.nivel}</div>
                    </div>

                    <div className="lm-diagnostic-loss-value">
                      {formatMoney(item.valor)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lm-diagnostic-section-card">
              <div className="lm-diagnostic-card-head">
                <h2>Atenção</h2>
              </div>

              <div className="lm-diagnostic-alert-list">
                {data.alertas.map((item) => (
                  <div key={`alerta-${item}`} className="lm-diagnostic-alert danger">
                    {item}
                  </div>
                ))}

                {data.acoes.map((item) => (
                  <div key={`acao-${item}`} className="lm-diagnostic-alert success">
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





