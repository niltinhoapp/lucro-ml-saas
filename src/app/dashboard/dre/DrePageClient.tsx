"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import DreResumo from "@/features/dre/components/DreResumo";
import DreInsights from "@/features/dre/components/DreInsights";
import ExportarPDF from "@/features/dre/components/ExportarPDF";

import DreInsightsAI from "@/components/dre/DreInsightsAI";
import PriceSuggestAI from "@/components/dre/PriceSuggestAI";
import DreRiskBadge from "@/components/dre/DreRiskBadge";
import ProdutosRank from "@/components/dre/ProdutosRank";

import { gerarInsightsDre } from "@/lib/dre/insights";
import { LinhaVenda } from "@/types/vendas";

type Dre = {
  receitaTotal: number;
  custoProdutos: number;
  taxas: number;
  logistica: number;
  lucro: number;
  margem: number;
};

type ApiSimulacao = {
  id: string;
  nome?: string | null;
  arquivo_nome?: string | null;
  created_at?: string | null;
  dre: Dre;
  linhas?: LinhaVenda[] | null;
  avisos?: string[];
  error?: string;
};

const emptyDre: Dre = {
  receitaTotal: 0,
  custoProdutos: 0,
  taxas: 0,
  logistica: 0,
  lucro: 0,
  margem: 0,
};

const fmtDateBR = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR");
};

export default function DrePageClient({ id }: { id: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiSimulacao | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);

        if (!id || id === "undefined") {
          if (alive) setData({ id: "", dre: emptyDre, error: "Sem ID válido." });
          return;
        }

        const res = await fetch(`/api/simulacoes/${id}`, { cache: "no-store" });

        if (!res.ok) {
          const msg = `Erro ao carregar simulação (HTTP ${res.status}).`;
          if (alive) setData({ id, dre: emptyDre, error: msg });
          return;
        }

        const json = (await res.json()) as ApiSimulacao;

        if (!alive) return;

        setData({
          ...json,
          id: json?.id ?? id,
          dre: json?.dre ?? emptyDre,
        });
      } catch {
        if (!alive) return;
        setData({ id, dre: emptyDre, error: "Falha ao carregar simulação." });
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [id]);

  const insights = useMemo(() => {
    if (!data?.dre) return [];
    return gerarInsightsDre(data.dre);
  }, [data?.dre]);

  if (loading) {
    return (
      <div className="dre-page stack">
        <div className="dre-hero card card-pad">
          <div className="dre-hero-left">
            <div className="chip pro">PRO</div>
            <h1 className="dre-page-title">Carregando DRE</h1>
            <p className="dre-page-subtitle">
              Estamos preparando sua análise financeira.
            </p>
          </div>
        </div>

        <div className="dre-loading card card-pad">
          <div className="dre-loading-bar" />
          <div className="dre-loading-bar short" />
        </div>
      </div>
    );
  }

  if (!data || data?.error) {
    return (
      <div className="dre-page stack">
        <div className="dre-error card card-pad">
          <div className="dre-error-kicker">Erro</div>
          <h1 className="dre-page-title">Não foi possível carregar o DRE</h1>
          <p className="dre-page-subtitle">
            {data?.error ?? "Não foi possível carregar o DRE."}
          </p>

          <div className="ai-actions">
            <button className="btn btn-primary" onClick={() => router.push("/dashboard/historico")}>
              Voltar para histórico
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dre = data.dre;

  return (
    <div className="dre-page stack">
      {/* Hero / top */}
      <div className="dre-hero card card-pad">
        <div className="dre-hero-left">
          <div className="dre-top-row">
            <span className="chip pro">PRO</span>
            {data?.created_at ? (
              <span className="chip">{fmtDateBR(data.created_at)}</span>
            ) : null}
          </div>

          <h1 className="dre-page-title">DRE da simulação</h1>
          <p className="dre-page-subtitle">
            {data?.nome ? data.nome : "Simulação"} — visão executiva da operação,
            leitura de margem, riscos e ações sugeridas.
          </p>
        </div>

        <div className="dre-hero-actions">
          <button className="btn btn-ghost" onClick={() => router.push("/dashboard/historico")}>
            Voltar
          </button>
        </div>
      </div>

      {/* Resumo */}
      <DreResumo dre={dre} />

      {/* Grid de módulos IA */}
      <div className="ai-grid">
        <ProdutosRank linhas={data?.linhas ?? null} />

        <section className="ai-card">
          <div className="ai-head">
            <div>
              <h3 className="ai-title">Detector de Prejuízo</h3>
              <p className="ai-desc">
                Diagnóstico automático do risco do seu DRE.
              </p>
            </div>

            <span className="chip pro">PRO</span>
          </div>

          <div className="ai-body">
            <div className="ai-result">
              <h4>Risco da operação</h4>
              <div className="dre-risk-wrap">
                <DreRiskBadge dre={dre} />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Preço */}
      <div className="dre-module">
        <PriceSuggestAI
          custoProduto={dre.custoProdutos}
          logistica={dre.logistica}
          taxaPercentDefault={dre.receitaTotal > 0 ? dre.taxas / dre.receitaTotal : 0.16}
        />
      </div>

      {/* Insights locais */}
      <div className="dre-module">
        <DreInsights insights={insights} />
      </div>

      {/* Insights IA */}
      <div className="dre-module">
        <DreInsightsAI dre={dre} />
      </div>

      {/* PDF */}
      <div className="dre-module">
        <ExportarPDF nome={data?.nome ?? "DRE"} dre={dre} />
      </div>
    </div>
  );
}