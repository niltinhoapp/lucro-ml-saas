"use client";

import { useEffect, useMemo, useState } from "react";
import ProUpgradeButton from "@/components/pro/ProUpgradeButton";

type SimResponse = {
  investimento: number;
  faturamento: number;
  lucroLote: number;
  margem: number;
  mesesParaGirar: number;
  retornoSobreEstoque: number;
  parecer: string;
  acoes: string[];
};

type FormState = {
  produto: string;
  precoVenda: string;
  custoUnitario: string;
  freteUnitario: string;
  taxaPercent: string;
  quantidade: string;
  giroMensal: string;
};

const initialForm: FormState = {
  produto: "camera veicular 4k",
  precoVenda: "189.9",
  custoUnitario: "79.5",
  freteUnitario: "18",
  taxaPercent: "16",
  quantidade: "80",
  giroMensal: "35",
};

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
    custoUnitario: "Custo unitário",
    freteUnitario: "Frete unitário",
    taxaPercent: "Taxa do marketplace (%)",
    quantidade: "Quantidade do lote",
    giroMensal: "Giro mensal estimado",
  };

  return labels[key];
}

function getRoiTone(roi: number): "good" | "info" | "warn" {
  if (roi >= 30) return "good";
  if (roi >= 15) return "info";
  return "warn";
}

export default function SimuladorEstoqueClient() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [data, setData] = useState<SimResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const roiTone = useMemo(() => {
    if (!data) return "info";
    return getRoiTone(data.retornoSobreEstoque);
  }, [data]);

  async function simular() {
    setLoading(true);

    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, k === "produto" ? v : Number(v)])
      );

      const res = await fetch("/api/ai/stock-buy-simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    simular();
  }, []);

  return (
    <div className="market-page page-wrap">
      <section className="seller-hero seller-hero-stock exec-hero">
        <div className="exec-hero-top">
          <div className="exec-hero-copy">
            <span className="badge pro">Simulador de compra</span>

            <h1 className="exec-title">
              Saiba se vale comprar estoque antes de investir
            </h1>

            <p className="exec-subtitle">
              O seller precisa ver capital imobilizado, giro e retorno do lote
              antes de colocar dinheiro no estoque.
            </p>

            <div className="exec-hero-proof">
              <span className="pill good">ROI do lote</span>
              <span className="pill">Capital imobilizado</span>
              <span className="pill">Tempo de giro</span>
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
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-primary btn-big"
              onClick={simular}
              disabled={loading}
            >
              {loading ? "Simulando..." : "Simular lote"}
            </button>
          </div>
        </div>
      </section>

      {data ? (
        <>
          <section className="diagnostic-score-card card card-premium">
            <div className="card-head">
              <div className="min-w-0">
                <h2>Leitura executiva do lote</h2>
                <p className="subtitle">
                  Entenda se o lote faz sentido para o caixa e para a operação.
                </p>
              </div>

              <span className={`badge ${roiTone === "good" ? "ok" : roiTone === "warn" ? "bad" : "pro"}`}>
                ROI {data.retornoSobreEstoque.toFixed(2)}%
              </span>
            </div>

            <div className="diagnostic-score-grid">
              <div className={`diagnostic-score-main tone-${roiTone}`}>
                <div className="diagnostic-score-label">Retorno sobre o estoque</div>

                <div className="diagnostic-score-value">
                  {data.retornoSobreEstoque.toFixed(2)}%
                </div>

                <div className="diagnostic-score-bar">
                  <div
                    className={`diagnostic-score-bar-fill tone-${roiTone}`}
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, data.retornoSobreEstoque)
                      )}%`,
                    }}
                  />
                </div>

                <p className="diagnostic-score-text">{data.parecer}</p>
              </div>

              <div className="exec-kpi-grid diagnostic-kpis">
                <div className="exec-kpi-card">
                  <div className="market-kpi-label">Investimento</div>
                  <div className="exec-kpi-value">
                    {formatMoney(data.investimento)}
                  </div>
                  <div className="exec-kpi-note">Valor imobilizado no lote.</div>
                </div>

                <div className="exec-kpi-card tone-good">
                  <div className="market-kpi-label">Lucro do lote</div>
                  <div className="exec-kpi-value">
                    {formatMoney(data.lucroLote)}
                  </div>
                  <div className="exec-kpi-note">Lucro estimado da operação.</div>
                </div>

                <div className="exec-kpi-card tone-info">
                  <div className="market-kpi-label">Faturamento</div>
                  <div className="exec-kpi-value">
                    {formatMoney(data.faturamento)}
                  </div>
                  <div className="exec-kpi-note">Receita estimada do lote.</div>
                </div>

                <div className="exec-kpi-card">
                  <div className="market-kpi-label">Margem</div>
                  <div className="exec-kpi-value">{data.margem.toFixed(2)}%</div>
                  <div className="exec-kpi-note">Margem total estimada.</div>
                </div>

                <div className="exec-kpi-card tone-info">
                  <div className="market-kpi-label">Meses para girar</div>
                  <div className="exec-kpi-value">
                    {data.mesesParaGirar.toFixed(1)}
                  </div>
                  <div className="exec-kpi-note">Tempo estimado de giro do lote.</div>
                </div>

                <div className={`exec-kpi-card tone-${roiTone}`}>
                  <div className="market-kpi-label">ROI estoque</div>
                  <div className="exec-kpi-value">
                    {data.retornoSobreEstoque.toFixed(2)}%
                  </div>
                  <div className="exec-kpi-note">Retorno esperado sobre o capital.</div>
                </div>
              </div>
            </div>
          </section>

          <section className="market-grid-2">
            <div className="card card-premium exec-section-card">
              <div className="card-head">
                <div className="min-w-0">
                  <h2>Parecer operacional</h2>
                  <p className="subtitle">
                    Leitura para decidir se vale entrar com esse lote agora.
                  </p>
                </div>
              </div>

              <div className={`alert ${roiTone === "warn" ? "danger" : "info"}`}>
                {data.parecer}
              </div>
            </div>

            <div className="card card-premium exec-section-card">
              <div className="card-head">
                <div className="min-w-0">
                  <h2>Ações recomendadas</h2>
                  <p className="subtitle">
                    Próximos passos para proteger o caixa e melhorar o lote.
                  </p>
                </div>
              </div>

              <div className="market-summary-list">
                {data.acoes.map((a) => (
                  <div key={a} className="alert success">
                    {a}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <ProUpgradeButton
            title="Assine o PRO para comparar cenários e versões de lote"
            subtitle="Tenha histórico de simulações por produto e decida melhor onde colocar seu caixa."
          />
        </>
      ) : null}
    </div>
  );
}