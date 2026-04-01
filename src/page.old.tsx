"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import DreResumo from "@/features/dre/components/DreResumo";
import DreInsights from "@/features/dre/components/DreInsights";
import ExportarPDF from "@/features/dre/components/ExportarPDF";
import { gerarInsightsDre } from "@/lib/dre/insights";

import FullVsFlexAI from "@/components/full-vs-flex/FullVsFlexAI";
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

  camposDetectados?: Record<string, string> | null;
  camposIgnorados?: string[] | null;
  sheetHeaders?: string[] | null;
  headersNormalizados?: string[] | null;
  totalLinhasBrutas?: number | null;
  totalLinhasValidas?: number | null;
  headerIdx?: number | null;
  sheetName?: string | null;

  error?: string;
};

function moeda(v: number) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDateBR(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("pt-BR");
}

function toneFromMargem(m: number): "good" | "warn" | "bad" {
  if (m >= 10) return "good";
  if (m >= 0) return "warn";
  return "bad";
}

export default function DrePage() {
  const router = useRouter();
  const search = useSearchParams();
  const id = search.get("id");
  const debug = search.get("debug") === "1";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiSimulacao | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function load() {
      if (!id) {
        router.replace("/dashboard");
        return;
      }

      setLoading(true);
      setErro("");

      try {
        const res = await fetch(`/api/simulacoes/${id}`, { cache: "no-store" });
        const json = (await res.json()) as ApiSimulacao;
        if (!res.ok) throw new Error(json?.error || "Falha ao carregar o relatório.");
        setData(json);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Erro ao carregar relatório.";
        setErro(msg);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, router]);

  const dre = data?.dre ?? null;

  const totalDespesas = useMemo(() => {
    if (!dre) return 0;
    return Number(dre.custoProdutos || 0) + Number(dre.taxas || 0) + Number(dre.logistica || 0);
  }, [dre]);

  const insights = useMemo(() => {
    if (!dre) return [];
    return gerarInsightsDre(dre);
  }, [dre]);

  const nomeRelatorio = useMemo(() => {
    if (data?.nome) return data.nome;
    if (data?.id) return `Simulação #${data.id.slice(0, 6).toUpperCase()}`;
    return "Relatório DRE";
  }, [data?.nome, data?.id]);

  if (loading) {
    return (
      <div className="page-wrap dre-page">
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Carregando…</h2>
              <p>Buscando dados do relatório.</p>
            </div>
          </div>
          <div className="card-body">
            <div className="progress">
              <div className="progress-bar" />
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="page-wrap dre-page">
        <section className="card dre-error">
          <div className="card-head">
            <div>
              <h2 className="dre-error-title">Não foi possível abrir</h2>
              <p className="dre-error-sub">{erro}</p>
            </div>

            <div className="actions">
              <button className="btn btn-ghost" onClick={() => router.push("/")}>🏠 Home</button>
              <button className="btn" onClick={() => router.push("/dashboard")}>← Painel</button>
            </div>
          </div>

          <div className="card-body">
            <div className="alert danger">Verifique se esta simulação existe no histórico.</div>
          </div>
        </section>
      </div>
    );
  }

  if (!dre || !data) {
    return (
      <div className="page-wrap dre-page">
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Relatório indisponível</h2>
              <p>Não encontramos dados nesta simulação.</p>
            </div>
            <div className="actions">
              <button className="btn btn-ghost" onClick={() => router.push("/")}>🏠 Home</button>
              <button className="btn" onClick={() => router.push("/dashboard")}>← Painel</button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const margemTone = toneFromMargem(Number(dre.margem || 0));
  const idShort = data.id.slice(0, 6).toUpperCase();
  const created = fmtDateBR(data.created_at);

  return (
    <div className="page-wrap dre-page">
      {/* TOPBAR */}
      <section className="topbar dre-topbar">
        <div className="dre-topbar-left">
          <span className="badge pro">📄 DRE</span>

          <h2 className="dre-title" title={nomeRelatorio}>
            {nomeRelatorio}
          </h2>

          <div className="dre-meta">
            {data?.arquivo_nome ? (
              <strong className="dre-file">{data.arquivo_nome}</strong>
            ) : (
              <span className="dre-file-muted">Simulação salva</span>
            )}
            {created ? <span className="dre-meta-dot">•</span> : null}
            {created ? <span className="dre-date">{created}</span> : null}
          </div>

          <div className="dre-pills">
            <span className="pill">ID: {idShort}</span>
            <span className={`pill ${margemTone}`}>
              {margemTone === "good" ? "Margem OK" : margemTone === "warn" ? "Margem baixa" : "Negativo"}
            </span>
          </div>
        </div>

        <div className="actions dre-actions">
          <button className="btn btn-ghost" onClick={() => router.push("/")}>🏠 Home</button>
          <button className="btn" onClick={() => router.push("/dashboard")}>← Painel</button>
          <button className="btn btn-success" onClick={() => router.push("/dashboard")}>+ Nova simulação</button>

          <div className="dre-pdf">
            <ExportarPDF nome={nomeRelatorio} dre={dre} />
          </div>
        </div>
      </section>

      {/* ALERTAS */}
      {data?.avisos?.length ? (
        <section className="card">
          <div className="card-head">
            <div>
              <h3>⚠️ Alertas</h3>
              <p>Itens que podem afetar o resultado.</p>
            </div>
          </div>
          <div className="card-body">
            <div className="alert warn">
              <ul className="dre-alert-list">
                {data.avisos.map((a, i) => (
                  <li key={i} className="dre-alert-item">{a}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {/* KPIS */}
      <section className="kpis" aria-label="Indicadores principais">
        <Kpi tone="good" label="Receita" value={moeda(dre.receitaTotal)} />
        <Kpi tone="neutral" label="Custos + Taxas + Logística" value={moeda(totalDespesas)} />
        <Kpi tone={margemTone} label="Margem" value={`${Number(dre.margem || 0).toFixed(2)}%`} />
      </section>

      {/* RESULTADO */}
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Resultado</h2>
            <p>Lucro, custos e composição do DRE.</p>
          </div>

          <div className="badges">
            <span className="badge pro">PRO</span>
            <span className={`badge ${dre.lucro >= 0 ? "ok" : "bad"}`}>
              {dre.lucro >= 0 ? "Lucro positivo" : "Lucro negativo"}
            </span>
          </div>
        </div>

        <div className="card-body">
          <DreResumo dre={dre} />
        </div>
      </section>

      {/* FULL VS FLEX */}
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Full vs Flex</h2>
            <p>Compare os dois modos e receba recomendação automática.</p>
          </div>
          <div className="badges">
            <span className="badge pro">PRO</span>
          </div>
        </div>

        <div className="card-body">
          <FullVsFlexAI
            receitaTotal={dre.receitaTotal}
            custoProdutos={dre.custoProdutos}
            fullTaxaDefault={dre.receitaTotal > 0 ? dre.taxas / dre.receitaTotal : 0.16}
            flexTaxaDefault={dre.receitaTotal > 0 ? dre.taxas / dre.receitaTotal : 0.16}
            fullLogisticaDefault={dre.logistica}
            flexLogisticaDefault={dre.logistica}
          />
        </div>
      </section>

      {/* INSIGHTS */}
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Insights</h2>
            <p>Alertas e oportunidades.</p>
          </div>
        </div>

        <div className="card-body">
          <DreInsights insights={insights} />
        </div>
      </section>

      {/* DEBUG */}
      {debug ? (
        <details className="dre-debug">
          <summary>Diagnóstico técnico</summary>
          <pre className="dre-pre">
{JSON.stringify(
  {
    arquivo_nome: data?.arquivo_nome,
    sheetName: data?.sheetName,
    headerIdx: data?.headerIdx,
    totalLinhasBrutas: data?.totalLinhasBrutas,
    totalLinhasValidas: data?.totalLinhasValidas,
    camposDetectados: data?.camposDetectados,
    camposIgnorados: data?.camposIgnorados,
    sheetHeaders: data?.sheetHeaders,
    headersNormalizados: data?.headersNormalizados,
  },
  null,
  2
)}
          </pre>
        </details>
      ) : null}

      <div className="small dre-footer">
        Lucro ML • PRO • {new Date().toLocaleDateString("pt-BR")}
      </div>
    </div>
  );
}

/* ===== KPI (SEM inline) ===== */
function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "warn" | "bad" | "neutral";
}) {
  return (
    <div className={`kpi ${tone}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}