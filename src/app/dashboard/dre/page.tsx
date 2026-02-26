"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import DreResumo from "@/features/dre/components/DreResumo";
import DreInsights from "@/features/dre/components/DreInsights";
import ExportarPDF from "@/features/dre/components/ExportarPDF";
import { gerarInsightsDre } from "@/lib/dre/insights";

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
      } catch (e: any) {
        setErro(e?.message || "Erro ao carregar relatório.");
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
      <div className="page-wrap">
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Carregando…</h2>
              <p>Buscando dados do relatório.</p>
            </div>
          </div>
          <div className="card-body">
            <div className="progress">
              <div className="progress-bar" style={{ width: "55%" }} />
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="page-wrap">
        <section className="card">
          <div className="card-head">
            <div>
              <h2 style={{ color: "#fee2e2" }}>Não foi possível abrir</h2>
              <p style={{ color: "#fecaca" }}>{erro}</p>
            </div>
            <div className="actions">
              <button className="btn btn-ghost" onClick={() => router.push("/")}>🏠 Home</button>
              <button className="btn-dark" onClick={() => router.push("/dashboard")}>← Painel</button>
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
      <div className="page-wrap">
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Relatório indisponível</h2>
              <p>Não encontramos dados nesta simulação.</p>
            </div>
            <div className="actions">
              <button className="btn btn-ghost" onClick={() => router.push("/")}>🏠 Home</button>
              <button className="btn-dark" onClick={() => router.push("/dashboard")}>← Painel</button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ===== RELATÓRIO =====
  return (
    <div className="page-wrap">
      {/* Topbar curto (sem parágrafo grande) */}
      <section className="topbar">
        <div style={{ minWidth: 0 }}>
          <span className="badge pro">📄 DRE</span>
          <h2 style={{ marginTop: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {nomeRelatorio}
          </h2>

          <div className="subtitle" style={{ marginTop: 8 }}>
            {data?.arquivo_nome ? (
              <>
                <strong style={{ color: "rgba(229,231,235,.92)" }}>{data.arquivo_nome}</strong>
              </>
            ) : (
              <span style={{ color: "rgba(229,231,235,.70)" }}>Simulação salva</span>
            )}
            {data?.created_at ? (
              <>
                {" "}
                • <span style={{ color: "rgba(229,231,235,.55)" }}>{fmtDateBR(data.created_at)}</span>
              </>
            ) : null}
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="pill">ID: {data.id.slice(0, 6).toUpperCase()}</span>
            {dre.margem >= 10 ? (
              <span className="pill good">Margem OK</span>
            ) : dre.margem >= 0 ? (
              <span className="pill warn">Margem baixa</span>
            ) : (
              <span className="pill bad">Negativo</span>
            )}
          </div>
        </div>

        <div className="actions">
          <button className="btn btn-ghost" onClick={() => router.push("/")}>🏠 Home</button>
          <button className="btn-dark" onClick={() => router.push("/dashboard")}>← Painel</button>
          <button className="btn btn-success" onClick={() => router.push("/dashboard")}>
            + Nova simulação
          </button>
          <div style={{ display: "inline-flex" }}>
            <ExportarPDF nome={nomeRelatorio} dre={dre} />
          </div>
        </div>
      </section>

      {/* Alertas do arquivo (só se existir) */}
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
              <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
                {data.avisos.map((a, i) => (
                  <li key={i} style={{ fontWeight: 900 }}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {/* KPIs */}
      <section className="kpis">
        <Kpi tone="good" label="Receita" value={moeda(dre.receitaTotal)} />
        <Kpi tone="neutral" label="Custos + Taxas + Logística" value={moeda(totalDespesas)} />
        <Kpi
          tone={dre.margem >= 10 ? "good" : dre.margem >= 0 ? "warn" : "bad"}
          label="Margem"
          value={`${Number(dre.margem || 0).toFixed(2)}%`}
        />
      </section>

      {/* Resultado */}
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Resultado</h2>
            <p>Lucro, custos e composição do DRE.</p>
          </div>

          <div className="badges">
            <span className="badge pro">PRO</span>
            <span className={dre.lucro >= 0 ? "badge ok" : "badge"} style={dre.lucro < 0 ? { background: "rgba(239,68,68,.14)", borderColor: "rgba(239,68,68,.25)", color: "#fee2e2" } : undefined}>
              {dre.lucro >= 0 ? "Lucro positivo" : "Lucro negativo"}
            </span>
          </div>
        </div>

        <div className="card-body">
          <DreResumo dre={dre} />
        </div>
      </section>

      {/* Insights */}
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

      {/* Diagnóstico (debug=1) */}
      {debug ? (
        <details style={{ marginTop: 12 }}>
          <summary>Diagnóstico técnico</summary>
          <pre style={{ marginTop: 12, fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
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

      <div className="small" style={{ textAlign: "center" }}>
        Lucro ML • PRO • {new Date().toLocaleDateString("pt-BR")}
      </div>
    </div>
  );
}

/* ===== KPI ===== */
function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "warn" | "bad" | "neutral";
}) {
  const style =
    tone === "good"
      ? {
          bg: "radial-gradient(900px 260px at 20% 0%, rgba(34,197,94,.22), transparent 60%), rgba(255,255,255,.06)",
          border: "rgba(34,197,94,.28)",
          label: "rgba(220,252,231,.92)",
          value: "rgba(220,252,231,.98)",
        }
      : tone === "warn"
      ? {
          bg: "radial-gradient(900px 260px at 20% 0%, rgba(245,158,11,.22), transparent 60%), rgba(255,255,255,.06)",
          border: "rgba(245,158,11,.30)",
          label: "rgba(255,237,213,.92)",
          value: "rgba(255,237,213,.98)",
        }
      : tone === "bad"
      ? {
          bg: "radial-gradient(900px 260px at 20% 0%, rgba(239,68,68,.22), transparent 60%), rgba(255,255,255,.06)",
          border: "rgba(239,68,68,.30)",
          label: "rgba(254,226,226,.92)",
          value: "rgba(254,226,226,.98)",
        }
      : {
          bg: "radial-gradient(900px 260px at 20% 0%, rgba(59,130,246,.20), transparent 60%), rgba(255,255,255,.05)",
          border: "rgba(255,255,255,.14)",
          label: "rgba(229,231,235,.82)",
          value: "rgba(229,231,235,.95)",
        };

  return (
    <div className="kpi" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
      <div className="label" style={{ color: style.label }}>{label}</div>
      <div className="value" style={{ color: style.value }}>{value}</div>
    </div>
  );
}
