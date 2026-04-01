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
    custoUnitario: "Custo no fornecedor",
    freteUnitario: "Frete por unidade",
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

function getBadgeClass(roiTone: "good" | "info" | "warn") {
  if (roiTone === "good") return "ok";
  if (roiTone === "info") return "pro";
  return "bad";
}

export default function SimuladorEstoqueClient() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [data, setData] = useState<SimResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roiTone = useMemo(() => {
    if (!data) return "info";
    return getRoiTone(data.retornoSobreEstoque);
  }, [data]);

  async function simular() {
    setLoading(true);
    setError(null);

    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, k === "produto" ? v : Number(v)])
      );

      const res = await fetch("/api/ai/stock-buy-simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Não foi possível simular este lote agora.");
      }

      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro ao simular o lote.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    simular();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="market-page page-wrap">
      <section className="seller-hero seller-hero-stock exec-hero">
        <div className="exec-hero-top">
          <div className="exec-hero-copy">
            <span className="badge pro">Simulador de compra</span>

            <h1 className="exec-title">
              Veja se esse lote faz sentido antes de colocar dinheiro no estoque
            </h1>

            <p className="exec-subtitle">
              Preencha os dados do produto e entenda com mais clareza quanto capital
              ficará imobilizado, qual retorno pode voltar para o caixa e em quanto
              tempo esse lote tende a girar.
            </p>

            <div className="exec-hero-proof">
              <span className="pill good">Lucro estimado</span>
              <span className="pill">Retorno sobre o lote</span>
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
              {loading ? "Simulando compra..." : "Simular compra"}
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <section className="card card-premium dre-error">
          <div className="dre-error-kicker">Não foi possível concluir a simulação</div>
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
                <h2>Resumo da simulação</h2>
                <p className="subtitle">
                  Veja rapidamente se esse lote tende a fortalecer sua operação ou pressionar seu caixa.
                </p>
              </div>

              <span className={`badge ${getBadgeClass(roiTone)}`}>
                ROI {data.retornoSobreEstoque.toFixed(2)}%
              </span>
            </div>

            <div className="diagnostic-score-grid">
              <div className={`diagnostic-score-main tone-${roiTone}`}>
                <div className="diagnostic-score-label">Retorno sobre o lote</div>

                <div className="diagnostic-score-value">
                  {data.retornoSobreEstoque.toFixed(2)}%
                </div>

                <div className="diagnostic-score-bar">
                  <div
                    className={`diagnostic-score-bar-fill tone-${roiTone}`}
                    style={{
                      width: `${Math.max(0, Math.min(100, data.retornoSobreEstoque))}%`,
                    }}
                  />
                </div>

                <p className="diagnostic-score-text">{data.parecer}</p>
              </div>

              <div className="exec-kpi-grid diagnostic-kpis">
                <div className="exec-kpi-card">
                  <div className="market-kpi-label">Investimento no lote</div>
                  <div className="exec-kpi-value">{formatMoney(data.investimento)}</div>
                  <div className="exec-kpi-note">Capital que ficará parado na compra.</div>
                </div>

                <div className="exec-kpi-card tone-good">
                  <div className="market-kpi-label">Lucro estimado do lote</div>
                  <div className="exec-kpi-value">{formatMoney(data.lucroLote)}</div>
                  <div className="exec-kpi-note">Ganho projetado com a venda do lote.</div>
                </div>

                <div className="exec-kpi-card tone-info">
                  <div className="market-kpi-label">Faturamento estimado</div>
                  <div className="exec-kpi-value">{formatMoney(data.faturamento)}</div>
                  <div className="exec-kpi-note">Receita prevista na venda total do lote.</div>
                </div>

                <div className="exec-kpi-card">
                  <div className="market-kpi-label">Margem estimada</div>
                  <div className="exec-kpi-value">{data.margem.toFixed(2)}%</div>
                  <div className="exec-kpi-note">Margem projetada para essa operação.</div>
                </div>

                <div className="exec-kpi-card tone-info">
                  <div className="market-kpi-label">Tempo de giro</div>
                  <div className="exec-kpi-value">{data.mesesParaGirar.toFixed(1)}</div>
                  <div className="exec-kpi-note">Tempo estimado para transformar estoque em venda.</div>
                </div>

                <div className={`exec-kpi-card tone-${roiTone}`}>
                  <div className="market-kpi-label">Retorno sobre o estoque</div>
                  <div className="exec-kpi-value">
                    {data.retornoSobreEstoque.toFixed(2)}%
                  </div>
                  <div className="exec-kpi-note">Retorno esperado sobre o capital investido.</div>
                </div>
              </div>
            </div>
          </section>

          <section className="market-grid-2">
            <div className="card card-premium exec-section-card">
              <div className="card-head">
                <div className="min-w-0">
                  <h2>Leitura da oportunidade</h2>
                  <p className="subtitle">
                    Entenda se esse lote parece saudável para avançar agora ou se pede mais cuidado.
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
                  <h2>Próximos passos sugeridos</h2>
                  <p className="subtitle">
                    Ações para proteger o caixa, melhorar a compra e decidir com mais segurança.
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
            title="Quer comparar cenários e testar versões diferentes do lote?"
            subtitle="No PRO você salva simulações, compara oportunidades e decide com mais clareza onde vale colocar seu caixa."
          />
        </>
      ) : null}
    </div>
  );
}



