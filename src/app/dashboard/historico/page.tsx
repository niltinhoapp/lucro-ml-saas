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
  if (m >= 15) return "good";
  if (m >= 8) return "warn";
  return "bad";
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
    <div className="lm-history-page">
      <section className="lm-history-hero">
        <div className="lm-history-hero__top">
          <div>
            <span className="lm-history-chip">Histórico da operação</span>
            <h1 className="lm-history-title">Suas análises salvas</h1>
            <p className="lm-history-subtitle">
              Revise resultados anteriores, compare cenários e retome análises
              sem precisar começar do zero.
            </p>
          </div>

          <div className="lm-history-actions">
            <button
              className="btn btn-ghost"
              onClick={() => router.push("/dashboard")}
            >
              Voltar ao painel
            </button>

            <button
              className="btn-dark"
              onClick={() => router.push("/dashboard/lucro/diagnostico")}
            >
              Nova análise
            </button>
          </div>
        </div>
      </section>

      <section className="lm-history-card">
        <div className="lm-history-card__head">
          <div>
            <h2>Histórico de análises</h2>
            <p className="lm-history-card__subtitle">
              {loading
                ? "Carregando análises..."
                : `${items.length} análise(s) salva(s)`}
            </p>
          </div>

          <div className="lm-history-actions">
            <button
              className="btn btn-primary"
              onClick={() => router.push("/dashboard/lucro/diagnostico")}
            >
              Fazer nova análise
            </button>
          </div>
        </div>

        {erro ? <div className="lm-history-message danger">{erro}</div> : null}

        {!loading && !items.length && !erro ? (
          <div className="lm-history-message info">
            Você ainda não tem análises salvas. Faça sua primeira leitura de
            lucro para começar a montar seu histórico.
          </div>
        ) : null}

        <div className="lm-history-list">
          {items.map((sim) => (
            <div
              key={sim.id}
              className="lm-history-row"
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
              <div className="lm-history-row__left">
                <div className="lm-history-row__title">
                  {sim.nome ?? `Análise ${sim.id}`}
                </div>

                <div className="lm-history-row__meta">
                  {sim.created_at
                    ? new Date(sim.created_at).toLocaleString("pt-BR")
                    : ""}
                  {sim.arquivo_nome ? ` • ${sim.arquivo_nome}` : ""}
                </div>
              </div>

              <div className="lm-history-row__right">
                <div className="lm-history-pills">
                  <span
                    className={`lm-history-pill ${
                      Number(sim.lucro || 0) >= 0 ? "good" : "bad"
                    }`}
                  >
                    Lucro: R$ {Number(sim.lucro || 0).toLocaleString("pt-BR")}
                  </span>

                  <span
                    className={`lm-history-pill ${toneMargem(
                      Number(sim.margem || 0)
                    )}`}
                  >
                    Margem: {Number(sim.margem || 0).toFixed(2)}%
                  </span>
                </div>

                <div className="lm-history-row__link">Abrir análise →</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ProUpgradeButton
        title="Quer manter um histórico mais completo da sua operação?"
        subtitle="No PRO você acompanha análises, compara cenários e toma decisões com mais consistência ao longo do tempo."
      />

      <div className="lm-history-footer">
        Lucro ML • histórico de análises •{" "}
        {new Date().toLocaleDateString("pt-BR")}
      </div>
    </div>
  );
}