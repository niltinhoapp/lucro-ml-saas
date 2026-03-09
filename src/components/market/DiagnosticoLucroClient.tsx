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
    taxaPercent: "Taxa do marketplace (%)",
    devolucaoPercent: "Devolução (%)",
    adsPercent: "Tráfego / Ads (%)",
  };

  return labels[key];
}

export default function DiagnosticoLucroClient() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [data, setData] = useState<HiddenLossResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const scoreTone = useMemo(() => {
    if (!data) return "info";
    return getScoreTone(data.score);
  }, [data]);

  async function analisar() {
    setLoading(true);

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

      const json = await res.json();
      setData(json);
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
            <span className="badge pro">Detector de prejuízo oculto</span>

            <h1 className="exec-title">
              Encontre onde o lucro está vazando
            </h1>

            <p className="exec-subtitle">
              Taxa, frete, devolução e tráfego podem destruir sua margem sem o
              seller perceber. Aqui você enxerga o lucro real e decide com mais
              segurança.
            </p>

            <div className="exec-hero-proof">
              <span className="pill good">Lucro real</span>
              <span className="pill">Margem limpa</span>
              <span className="pill">Preço sugerido</span>
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
              {loading ? "Analisando..." : "Analisar lucro real"}
            </button>
          </div>
        </div>
      </section>

      {data ? (
        <>
          <section className="diagnostic-score-card card card-premium">
            <div className="card-head">
              <div className="min-w-0">
                <h2>Leitura executiva do produto</h2>
                <p className="subtitle">
                  Veja rapidamente a saúde do SKU e onde agir primeiro.
                </p>
              </div>

              <span className={`badge ${scoreTone === "good" ? "ok" : scoreTone === "warn" ? "bad" : "pro"}`}>
                {data.status}
              </span>
            </div>

            <div className="diagnostic-score-grid">
              <div className={`diagnostic-score-main tone-${scoreTone}`}>
                <div className="diagnostic-score-label">Score do produto</div>
                <div className="diagnostic-score-value">{data.score}/100</div>

                <div className="diagnostic-score-bar">
                  <div
                    className={`diagnostic-score-bar-fill tone-${scoreTone}`}
                    style={{ width: `${Math.max(0, Math.min(100, data.score))}%` }}
                  />
                </div>

                <p className="diagnostic-score-text">
                  {data.conclusao}
                </p>
              </div>

              <div className="exec-kpi-grid diagnostic-kpis">
                <div className="exec-kpi-card">
                  <div className="market-kpi-label">Lucro real</div>
                  <div className="exec-kpi-value">{formatMoney(data.lucro)}</div>
                  <div className="exec-kpi-note">Após perdas operacionais.</div>
                </div>

                <div className="exec-kpi-card">
                  <div className="market-kpi-label">Margem final</div>
                  <div className="exec-kpi-value">{data.margem.toFixed(2)}%</div>
                  <div className="exec-kpi-note">Margem efetiva do SKU.</div>
                </div>

                <div className="exec-kpi-card tone-info">
                  <div className="market-kpi-label">Preço sugerido</div>
                  <div className="exec-kpi-value">
                    {formatMoney(data.recomendacaoPreco)}
                  </div>
                  <div className="exec-kpi-note">Preço recomendado pela IA.</div>
                </div>
              </div>
            </div>
          </section>

          <section className="market-grid-2">
            <div className="card card-premium exec-section-card">
              <div className="card-head">
                <div className="min-w-0">
                  <h2>Perdas invisíveis</h2>
                  <p className="subtitle">
                    Custos escondidos que reduzem sua margem sem parecer óbvios.
                  </p>
                </div>

                <span className="badge pro">{data.status}</span>
              </div>

              <div className="diagnostic-loss-list">
                {data.perdas.map((item) => (
                  <div className="diagnostic-loss-item" key={item.item}>
                    <div className="diagnostic-loss-copy">
                      <div className="diagnostic-loss-title">{item.item}</div>
                      <div className="diagnostic-loss-meta">Nível {item.nivel}</div>
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
                  <h2>Ações de correção</h2>
                  <p className="subtitle">
                    Ajustes sugeridos para recuperar margem e melhorar a decisão.
                  </p>
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
            title="Quer salvar diagnósticos e monitorar margem por SKU?"
            subtitle="No PRO você acompanha a evolução por produto, compara cenários e usa a IA para corrigir a operação sem planilhas paralelas."
          />
        </>
      ) : null}
    </div>
  );
}