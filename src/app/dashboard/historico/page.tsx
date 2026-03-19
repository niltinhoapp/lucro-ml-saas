"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SimulacaoRow } from "@/types/simulacoes";
import ProUpgradeButton from "@/components/pro/ProUpgradeButton";

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Erro ao carregar.";
}

function toneMargem(m: number) {
  if (m >= 15) return "pill good";
  if (m >= 8) return "pill warn";
  return "pill bad";
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

        const raw = await res.text();
        const parsed = raw ? (JSON.parse(raw) as unknown) : null;

        if (!res.ok) {
          const apiMsg =
            parsed && typeof parsed === "object" && parsed !== null && "error" in parsed
              ? String((parsed as { error?: unknown }).error ?? "")
              : "";
          throw new Error(apiMsg || "Falha ao carregar histórico.");
        }

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
      <section className="topbar card card-premium">
        <div>
          <span className="badge pro">Histórico da operação</span>
          <h2 style={{ marginTop: 10 }}>Suas análises salvas de lucro e DRE</h2>
          <p className="subtitle">
            Revise resultados anteriores, compare cenários e retome análises sem precisar começar do zero.
          </p>
        </div>

        <div className="actions">
          <button className="btn btn-ghost" onClick={() => router.push("/dashboard")}>
            Voltar ao painel
          </button>
          <button className="btn-dark" onClick={() => router.push("/dashboard/lucro/diagnostico")}>
            Nova análise
          </button>
        </div>
      </section>

      <section className="card card-premium">
        <div className="card-head">
          <div>
            <h2>Histórico de análises</h2>
            <p className="subtitle">
              {loading ? "Carregando análises..." : `${items.length} análise(s) salva(s)`}
            </p>
          </div>

          <div className="actions">
            <button className="btn btn-primary" onClick={() => router.push("/dashboard/lucro/diagnostico")}>
              Fazer nova análise
            </button>
          </div>
        </div>

        <div className="card-body">
          {erro ? <div className="alert danger">{erro}</div> : null}

          {!loading && !items.length && !erro ? (
            <div className="alert info">
              Você ainda não tem análises salvas. Faça sua primeira leitura de lucro para começar a montar seu histórico.
            </div>
          ) : null}

          <div className="list">
            {items.map((sim) => (
              <div
                key={sim.id}
                className="row"
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/dashboard/lucro/dre?id=${sim.id}`)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    router.push(`/dashboard/lucro/dre?id=${sim.id}`);
                  }
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div className="title">{sim.nome ?? `Análise ${sim.id}`}</div>

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

                  <div className="small">Abrir análise →</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProUpgradeButton
        title="Quer manter um histórico mais completo da sua operação?"
        subtitle="No PRO você acompanha análises, compara cenários e toma decisões com mais consistência ao longo do tempo."
      />

      <div className="small" style={{ textAlign: "center" }}>
        Lucro ML • histórico de análises • {new Date().toLocaleDateString("pt-BR")}
      </div>
    </div>
  );
}
