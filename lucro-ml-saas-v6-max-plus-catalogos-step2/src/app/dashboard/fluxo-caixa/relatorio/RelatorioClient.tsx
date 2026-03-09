"use client";


import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Relatorio = {
  id: string;
  nome?: string | null;
  arquivo_nome?: string | null;
  created_at?: string | null;
};

type Lanc = {
  id: string;
  release_date: string | null;
  transaction_type?: string | null;
  description?: string | null;
  amount: number;
  balance?: number | null;
  direction?: "in" | "out" | string | null;
  categoria?: string | null;
};

function moeda(v?: number | null) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDateBR(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR");
}

function fmtDia(isoDate?: string | null) {
  if (!isoDate) return "";
  // isoDate vem "YYYY-MM-DD"
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

export default function FluxoCaixaRelatorioPage() {
  const router = useRouter();
  const search = useSearchParams();
  const id = search.get("id");

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [lancamentos, setLancamentos] = useState<Lanc[]>([]);

  useEffect(() => {
    async function load() {
      if (!id) {
        router.replace("/dashboard/fluxo-caixa");
        return;
      }

      setLoading(true);
      setErro("");

      try {
        const res = await fetch(`/api/caixa/${id}`, { cache: "no-store" });
        const json = await res.json();

        if (!res.ok) throw new Error(json?.error || "Falha ao carregar relatório.");

        setRelatorio(json?.relatorio ?? null);
        setLancamentos(json?.lancamentos ?? []);
      } catch (e: any) {
        setErro(e?.message || "Erro ao carregar relatório.");
        setRelatorio(null);
        setLancamentos([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, router]);

  const resumo = useMemo(() => {
    const entradas = lancamentos.reduce((acc, l) => acc + (Number(l.amount) > 0 ? Number(l.amount) : 0), 0);
    const saidasAbs = lancamentos.reduce((acc, l) => acc + (Number(l.amount) < 0 ? Math.abs(Number(l.amount)) : 0), 0);
    const saldo = entradas - saidasAbs;

    const periodoInicio = lancamentos[0]?.release_date ?? null;
    const periodoFim = lancamentos[lancamentos.length - 1]?.release_date ?? null;

    return { entradas, saidasAbs, saldo, periodoInicio, periodoFim };
  }, [lancamentos]);

  const porDia = useMemo(() => {
    const map = new Map<string, { dia: string; entrada: number; saida: number; saldoDia: number }>();

    for (const l of lancamentos) {
      const dia = l.release_date || "Sem data";
      const cur = map.get(dia) ?? { dia, entrada: 0, saida: 0, saldoDia: 0 };
      const amt = Number(l.amount || 0);

      if (amt >= 0) cur.entrada += amt;
      else cur.saida += Math.abs(amt);

      cur.saldoDia = cur.entrada - cur.saida;
      map.set(dia, cur);
    }

    return Array.from(map.values()).sort((a, b) => (a.dia > b.dia ? 1 : -1));
  }, [lancamentos]);

  const nomeTopo =
    relatorio?.nome?.trim() ||
    (relatorio?.arquivo_nome?.trim() ? `Relatório: ${relatorio.arquivo_nome.trim()}` : "Relatório de Fluxo de Caixa");

  // STATES
  if (loading) {
    return (
      <div className="page-wrap">
        <section className="card-premium" style={{ padding: 18 }}>
          <h3 style={{ fontWeight: 950 }}>Carregando relatório…</h3>
          <p className="muted" style={{ marginTop: 6 }}>
            Buscando lançamentos do extrato.
          </p>
          <div style={{ marginTop: 14 }} className="progress">
            <div />
          </div>
        </section>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="page-wrap">
        <section className="card-premium" style={{ padding: 18 }}>
          <h3 style={{ fontWeight: 950, color: "#fee2e2" }}>Não foi possível abrir</h3>
          <p className="muted" style={{ marginTop: 6 }}>
            {erro}
          </p>
          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn-dark" onClick={() => router.push("/dashboard/fluxo-caixa")}>
              ← Voltar
            </button>
            <button className="btn" onClick={() => router.push("/dashboard/fluxo-caixa/historico")}>
              Ver histórico
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      {/* HERO */}
      <section className="hero">
        <div className="hero-inner" style={{ gridTemplateColumns: "1.2fr .8fr" }}>
          <div>
            <div className="hero-badge">
              <span className="dot" />
              PRO • Fluxo de Caixa
            </div>

            <h1 style={{ fontSize: 28, marginTop: 12 }}>{nomeTopo}</h1>

            <p style={{ marginTop: 8 }}>
              {relatorio?.arquivo_nome ? (
                <>
                  Arquivo: <strong style={{ color: "rgba(255,255,255,.95)" }}>{relatorio.arquivo_nome}</strong>
                </>
              ) : (
                "Extrato importado."
              )}
              {relatorio?.created_at ? (
                <>
                  {" "}
                  • <span style={{ color: "rgba(229,231,235,.70)" }}>{fmtDateBR(relatorio.created_at)}</span>
                </>
              ) : null}
              {resumo.periodoInicio || resumo.periodoFim ? (
                <>
                  {" "}
                  • <span style={{ color: "rgba(229,231,235,.70)" }}>
                    Período: {fmtDia(resumo.periodoInicio)} → {fmtDia(resumo.periodoFim)}
                  </span>
                </>
              ) : null}
            </p>
          </div>

          <div className="actions" style={{ justifyContent: "flex-end", alignItems: "flex-start" }}>
            <button className="btn-dark" onClick={() => router.push("/dashboard/fluxo-caixa")}>
              ← Importar
            </button>

            <button className="btn-primary" onClick={() => router.push("/dashboard/fluxo-caixa/historico")}>
              Histórico
            </button>
          </div>
        </div>
      </section>

      {/* KPIs PRO (vivos) */}
      <section className="kpis">
        <div className="kpi" style={{ background: "rgba(34,197,94,.12)", borderColor: "rgba(34,197,94,.22)" }}>
          <div className="label" style={{ color: "#dcfce7" }}>
            Entradas
          </div>
          <div className="value" style={{ color: "#dcfce7" }}>
            {moeda(resumo.entradas)}
          </div>
        </div>

        <div className="kpi" style={{ background: "rgba(239,68,68,.12)", borderColor: "rgba(239,68,68,.22)" }}>
          <div className="label" style={{ color: "#fee2e2" }}>
            Saídas
          </div>
          <div className="value" style={{ color: "#fee2e2" }}>
            {moeda(resumo.saidasAbs)}
          </div>
        </div>

        <div
          className="kpi"
          style={{
            background: resumo.saldo >= 0 ? "rgba(59,130,246,.12)" : "rgba(245,158,11,.16)",
            borderColor: resumo.saldo >= 0 ? "rgba(59,130,246,.22)" : "rgba(245,158,11,.25)",
          }}
        >
          <div className="label" style={{ color: "rgba(229,231,235,.92)" }}>
            Saldo líquido
          </div>
          <div className="value" style={{ color: "rgba(229,231,235,.92)" }}>
            {moeda(resumo.saldo)}
          </div>
        </div>
      </section>

      {/* POR DIA */}
      <section className="card-premium" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: 18, borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <h3 style={{ fontWeight: 950 }}>Resumo por dia</h3>
          <p className="muted" style={{ marginTop: 6 }}>
            Entradas, saídas e saldo diário (baseado no extrato).
          </p>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Entradas</th>
                <th>Saídas</th>
                <th>Saldo do dia</th>
              </tr>
            </thead>
            <tbody>
              {porDia.map((d) => (
                <tr key={d.dia}>
                  <td>{d.dia === "Sem data" ? "Sem data" : fmtDia(d.dia)}</td>
                  <td style={{ color: "rgba(34,197,94,.95)", fontWeight: 900 }}>+ {moeda(d.entrada)}</td>
                  <td style={{ color: "rgba(239,68,68,.95)", fontWeight: 900 }}>- {moeda(d.saida)}</td>
                  <td style={{ fontWeight: 950, color: d.saldoDia >= 0 ? "rgba(229,231,235,.92)" : "#ffedd5" }}>
                    {moeda(d.saldoDia)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* LANÇAMENTOS (detalhado) */}
      <section className="card-premium" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: 18, borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <h3 style={{ fontWeight: 950 }}>Lançamentos</h3>
          <p className="muted" style={{ marginTop: 6 }}>
            Lista completa importada (para auditoria).
          </p>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Categoria</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Saldo parcial</th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.map((l) => (
                <tr key={l.id}>
                  <td>{l.release_date ? fmtDia(l.release_date) : "-"}</td>
                  <td>{l.categoria || "-"}</td>
                  <td style={{ maxWidth: 520 }}>
                    <div style={{ fontWeight: 950 }}>{l.transaction_type || "-"}</div>
                    <div style={{ opacity: 0.78, fontSize: 12 }}>{l.description || ""}</div>
                  </td>
                  <td style={{ fontWeight: 950, color: Number(l.amount) >= 0 ? "rgba(34,197,94,.95)" : "rgba(239,68,68,.95)" }}>
                    {Number(l.amount) >= 0 ? "+" : "-"} {moeda(Math.abs(Number(l.amount)))}
                  </td>
                  <td style={{ fontWeight: 900 }}>{typeof l.balance === "number" ? moeda(l.balance) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="small" style={{ textAlign: "center" }}>
        Lucro ML • PRO • {new Date().toLocaleDateString("pt-BR")}
      </div>
    </div>
  );
}
