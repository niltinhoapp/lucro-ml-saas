"use client";

import { useMemo, useState } from "react";

type ApiResult = {
  custo_total: number;
  taxa_percent: number;
  margem_alvo_percent: number;
  preco_min: number;
  preco_alvo: number;
  preco_competitivo: number;
  comparativo: {
    preco_atual: number | null;
    preco_mercado: number | null;
  };
  formula: string;
};

function money(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green" | "blue" | "neutral";
}) {
  const cls =
    tone === "green"
      ? "price-metric green"
      : tone === "blue"
      ? "price-metric blue"
      : "price-metric";

  return (
    <div className={cls}>
      <div className="price-metric-label">{label}</div>
      <div className="price-metric-value">{value}</div>
    </div>
  );
}

export default function PriceSuggestAI(props: {
  custoProduto: number;
  logistica: number;
  taxaPercentDefault?: number;
}) {
  const { custoProduto, logistica } = props;
  const taxaDefault = props.taxaPercentDefault ?? 0.16;

  const [taxaPct, setTaxaPct] = useState<number>(() =>
    Number((taxaDefault * 100).toFixed(2))
  );
  const [margemPct, setMargemPct] = useState<number>(20);
  const [precoAtual, setPrecoAtual] = useState<string>("");
  const [precoMercado, setPrecoMercado] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ApiResult | null>(null);

  const custoTotal = useMemo(
    () => Number((Number(custoProduto) + Number(logistica)).toFixed(2)),
    [custoProduto, logistica]
  );

  async function calcular() {
    setErr(null);
    setLoading(true);
    setData(null);

    try {
      const payload = {
        custo_produto: Number(custoProduto) || 0,
        logistica: Number(logistica) || 0,
        taxa_percent: (Number(taxaPct) || 0) / 100,
        margem_alvo: (Number(margemPct) || 0) / 100,
        preco_atual: precoAtual.trim() ? Number(precoAtual) : null,
        preco_mercado: precoMercado.trim() ? Number(precoMercado) : null,
      };

      const r = await fetch("/api/ai/price-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await r.json().catch(() => null);

      if (!r.ok) {
        setErr(j?.message ?? "Não foi possível calcular.");
        return;
      }

      setData(j.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="ai-card price-card">
      <div className="ai-head">
        <div>
          <h3 className="ai-title">Preço ideal</h3>
          <p className="ai-desc">Calcule preço mínimo, alvo e referência.</p>
        </div>

        <span className="chip pro">PRO</span>
      </div>

      <div className="ai-body">
        <div className="price-top-grid">
          <Metric label="Custo total" value={money(custoTotal)} tone="blue" />
        </div>

        <div className="ai-form">
          <div className="ai-form-row">
            <label className="price-field">
              <span className="label">Taxa (%)</span>
              <input
                className="input"
                type="number"
                step="0.01"
                value={taxaPct}
                onChange={(e) => setTaxaPct(Number(e.target.value))}
              />
            </label>

            <label className="price-field">
              <span className="label">Margem alvo (%)</span>
              <input
                className="input"
                type="number"
                step="1"
                value={margemPct}
                onChange={(e) => setMargemPct(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="ai-form-row">
            <label className="price-field">
              <span className="label">Preço atual</span>
              <input
                className="input"
                type="number"
                step="0.01"
                value={precoAtual}
                onChange={(e) => setPrecoAtual(e.target.value)}
              />
            </label>

            <label className="price-field">
              <span className="label">Preço mercado</span>
              <input
                className="input"
                type="number"
                step="0.01"
                value={precoMercado}
                onChange={(e) => setPrecoMercado(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="ai-actions">
          <button onClick={calcular} disabled={loading} className="btn btn-primary">
            {loading ? "Calculando..." : "Calcular preço"}
          </button>
        </div>

        {err && (
          <div className="ai-result price-error">
            <h4>Não foi possível calcular</h4>
            <p>{err}</p>
          </div>
        )}

        {data && (
          <>
            <div className="price-results">
              <div className="price-result-card neutral">
                <div className="price-result-k">Preço mínimo</div>
                <div className="price-result-v">{money(data.preco_min)}</div>
                <div className="price-result-h">Evita prejuízo</div>
              </div>

              <div className="price-result-card green">
                <div className="price-result-k">
                  Preço alvo ({data.margem_alvo_percent}%)
                </div>
                <div className="price-result-v">{money(data.preco_alvo)}</div>
                <div className="price-result-h">Protege sua margem</div>
              </div>

              <div className="price-result-card blue">
                <div className="price-result-k">Referência</div>
                <div className="price-result-v">{money(data.preco_competitivo)}</div>
                <div className="price-result-h">Base no mercado</div>
              </div>
            </div>

            <div className="price-footer-note">
              <span>Taxa: {data.taxa_percent}%</span>
              <span>•</span>
              <span>Custo: {money(data.custo_total)}</span>

              {data.comparativo.preco_atual != null && (
                <>
                  <span>•</span>
                  <span>Atual: {money(data.comparativo.preco_atual)}</span>
                </>
              )}

              {data.comparativo.preco_mercado != null && (
                <>
                  <span>•</span>
                  <span>Mercado: {money(data.comparativo.preco_mercado)}</span>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}





