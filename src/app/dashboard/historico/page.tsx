"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SimulacaoRow } from "@/types/simulacoes";

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Erro ao carregar.";
}

export default function HistoricoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SimulacaoRow[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErro("");

      try {
        const res = await fetch("/api/simulacoes", { cache: "no-store" });

        // tenta ler json, mas sem quebrar se vier vazio
        const raw = await res.text();
        const parsed = raw ? (JSON.parse(raw) as unknown) : null;

        if (!res.ok) {
          // se API retornar { error: "..." }
          const apiMsg =
            parsed && typeof parsed === "object" && parsed !== null && "error" in parsed
              ? String((parsed as { error?: unknown }).error ?? "")
              : "";
          throw new Error(apiMsg || "Falha ao carregar histórico.");
        }

        // garante array
        const arr = Array.isArray(parsed) ? (parsed as SimulacaoRow[]) : [];
        if (!alive) return;

        setItems(arr);
      } catch (e: unknown) {
        if (!alive) return;
        setErro(getErrorMessage(e));
        setItems([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="page-wrap historico-page">
      <section className="topbar">
        <div>
          <span className="badge">🕒 Histórico</span>
          <h2 style={{ marginTop: 10 }}>Simulações</h2>
          <p className="subtitle">Clique para abrir o DRE.</p>
        </div>

        <div className="actions">
          <button className="btn btn-ghost" onClick={() => router.push("/")}>
            🏠 Home
          </button>
          <button className="btn-dark" onClick={() => router.push("/dashboard")}>
            ← Painel
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Lista</h2>
            <p>{loading ? "Carregando…" : `${items.length} registro(s)`}</p>
          </div>

          <div className="actions">
            <button className="btn btn-success" onClick={() => router.push("/dashboard")}>
              + Nova simulação
            </button>
          </div>
        </div>

        <div className="card-body">
          {erro ? <div className="alert danger">{erro}</div> : null}

          {!loading && !items.length && !erro ? (
            <div className="alert info">Sem simulações ainda.</div>
          ) : null}

          <div className="list">
            {items.map((sim) => (
              <div
                key={sim.id}
                className="row"
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/dashboard/dre?id=${sim.id}`)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    router.push(`/dashboard/dre?id=${sim.id}`);
                  }
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div className="title">{sim.nome ?? `Simulação ${sim.id}`}</div>
                  <div className="meta">
                    {sim.created_at ? new Date(sim.created_at).toLocaleString("pt-BR") : ""}
                    {sim.arquivo_nome ? ` • ${sim.arquivo_nome}` : ""}
                  </div>
                </div>

                <div className="right">
                  <div className="pills">
                    <span className={Number(sim.lucro || 0) >= 0 ? "pill good" : "pill bad"}>
                      Lucro: R$ {Number(sim.lucro || 0).toLocaleString("pt-BR")}
                    </span>

                    <span className={toneMargem(Number(sim.margem || 0))}>
                      Margem: {Number(sim.margem || 0).toFixed(2)}%
                    </span>
                  </div>

                  <div className="small">Abrir DRE →</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="small" style={{ textAlign: "center" }}>
        Lucro ML • PRO • {new Date().toLocaleDateString("pt-BR")}
      </div>
    </div>
  );
}

function toneMargem(m: number) {
  if (m >= 15) return "pill good";
  if (m >= 8) return "pill warn";
  return "pill bad";
}