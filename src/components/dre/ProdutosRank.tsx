"use client";

import { useMemo, useState } from "react";

type LinhaVenda = {
  produto: string;
  receita: number;
  custo: number;
  taxa: number;
  logistica: number;
  data?: string;
};

type ProdutoAgg = {
  produto: string;
  qtd: number;
  receita: number;
  custo: number;
  taxa: number;
  logistica: number;
  lucro: number;
  margem_percent: number;
  taxa_percent: number;
  logistica_percent: number;
};

type ApiData = {
  total_produtos: number;
  top_n: number;
  top_lucro: ProdutoAgg[];
  top_prejuizo: ProdutoAgg[];
  top_taxa: ProdutoAgg[];
  top_logistica: ProdutoAgg[];
};

function money(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function RankRow({
  p,
  tone = "neutral",
}: {
  p: ProdutoAgg;
  tone?: "good" | "bad" | "blue" | "neutral";
}) {
  const lucroClass =
    p.lucro >= 0 ? "rank-row-value good" : "rank-row-value bad";

  const toneClass =
    tone === "good"
      ? "rank-item good"
      : tone === "bad"
      ? "rank-item bad"
      : tone === "blue"
      ? "rank-item blue"
      : "rank-item";

  return (
    <div className={toneClass}>
      <div className="rank-item-main">
        <div className="rank-item-title" title={p.produto}>
          {p.produto}
        </div>
        <div className="rank-item-meta">
          Qtd {p.qtd} • Receita {money(p.receita)} • Margem{" "}
          {p.margem_percent.toFixed(2)}%
        </div>
      </div>

      <div className="rank-item-side">
        <div className={lucroClass}>{money(p.lucro)}</div>
        <div className="rank-item-meta">
          Taxa {p.taxa_percent.toFixed(2)}% • Log {p.logistica_percent.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

function RankBlock({
  title,
  icon,
  items,
  tone,
}: {
  title: string;
  icon: string;
  items: ProdutoAgg[];
  tone?: "good" | "bad" | "blue" | "neutral";
}) {
  return (
    <div className="rank-block">
      <div className="rank-block-head">
        <div className="rank-block-title">
          <span>{icon}</span>
          <span>{title}</span>
        </div>
      </div>

      <div className="rank-block-body">
        {items.length ? (
          items.map((p) => <RankRow key={`${title}-${p.produto}`} p={p} tone={tone} />)
        ) : (
          <div className="rank-empty">Nenhum dado encontrado.</div>
        )}
      </div>
    </div>
  );
}

export default function ProdutosRank({ linhas }: { linhas?: LinhaVenda[] | null }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ApiData | null>(null);

  const linhasOk = useMemo(() => (Array.isArray(linhas) ? linhas : []), [linhas]);

  async function run() {
    setErr(null);
    setLoading(true);
    setData(null);

    try {
      if (!linhasOk.length) {
        setErr(
          "Este relatório não trouxe as linhas por produto. Precisa enviar/retornar as linhas na API da simulação."
        );
        return;
      }

      const r = await fetch("/api/ai/produtos-rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linhas: linhasOk, top_n: 8 }),
      });

      const j = await r.json().catch(() => null);
      if (!r.ok) {
        setErr(j?.message ?? "Erro ao gerar ranking.");
        return;
      }

      setData(j.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="ai-card rank-card">
      <div className="ai-head">
        <div>
          <h3 className="ai-title">Ranking de Produtos</h3>
          <p className="ai-desc">
            Descubra o que mais dá lucro, gera prejuízo e o que está consumindo margem
            em taxa e logística.
          </p>
        </div>

        <span className="chip pro">PRO</span>
      </div>

      <div className="ai-body">
        <div className="ai-actions">
          <button onClick={run} disabled={loading} className="btn btn-primary">
            {loading ? "Analisando..." : "Gerar ranking"}
          </button>
        </div>

        {err && (
          <div className="ai-result rank-error">
            <h4>Erro na análise</h4>
            <p>{err}</p>
          </div>
        )}

        {data && (
          <>
            <div className="rank-summary">
              <div className="rank-summary-box">
                <div className="rank-summary-k">Produtos analisados</div>
                <div className="rank-summary-v">{data.total_produtos}</div>
              </div>

              <div className="rank-summary-box">
                <div className="rank-summary-k">Top por grupo</div>
                <div className="rank-summary-v">{data.top_n}</div>
              </div>
            </div>

            <div className="rank-grid">
              <RankBlock title="Top Lucro" icon="🏆" items={data.top_lucro} tone="good" />
              <RankBlock title="Top Prejuízo" icon="🧨" items={data.top_prejuizo} tone="bad" />
              <RankBlock title="Taxa mais alta" icon="💸" items={data.top_taxa} tone="blue" />
              <RankBlock title="Logística mais alta" icon="🚚" items={data.top_logistica} tone="neutral" />
            </div>
          </>
        )}

        {!data && !err && (
          <div className="ai-result">
            <h4>Gerar ranking</h4>
            <p>
              Clique em <strong>Gerar ranking</strong> para analisar os produtos com maior
              lucro, prejuízo, taxa e logística.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}