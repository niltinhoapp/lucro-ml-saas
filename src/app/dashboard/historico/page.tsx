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

function brl(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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
            parsed &&
            typeof parsed === "object" &&
            parsed !== null &&
            "error" in parsed
              ? String((parsed as { error?: unknown }).error ?? "")
              : "";

          throw new Error(apiMsg || "Falha ao carregar histórico.");
        }

        const arr = Array.isArray(parsed)
          ? (parsed as SimulacaoRow[])
          : [];

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
      {/* HEADER */}
      <section className="lm-history-hero">
        <div className="lm-history-hero__top">
          <div>
            <span className="lm-history-chip">Histórico</span>

            <h1 className="lm-history-title">
              Suas decisões anteriores
            </h1>

            <p className="lm-history-subtitle">
              Revise análises e continue de onde parou.
            </p>
          </div>

          <div className="lm-history-actions">
            <button
              className="btn btn-ghost"
              onClick={() => router.push("/dashboard")}
            >
              Voltar
            </button>

            <button
              className="btn btn-primary"
              onClick={() =>
                router.push("/dashboard/lucro/diagnostico")
              }
            >
              Nova análise
            </button>
          </div>
        </div>
      </section>

      {/* LISTA */}
      <section className="lm-history-card">
        <div className="lm-history-card__head">
          <div>
            <h2>Histórico de análises</h2>

            <p className="lm-history-card__subtitle">
              {loading
                ? "Carregando..."
                : `${items.length} análise(s)`}
            </p>
          </div>
        </div>

        {erro ? (
          <div className="lm-history-message danger">{erro}</div>
        ) : null}

        {!loading && !items.length && !erro ? (
          <div className="lm-history-message info">
            Nenhuma análise encontrada. Faça sua primeira análise de lucro.
          </div>
        ) : null}

        <div className="lm-history-list">
          {items.map((sim) => {
            const lucro = Number(sim.lucro || 0);
            const margem = Number(sim.margem || 0);

            return (
              <div
                key={sim.id}
                className="lm-history-row"
                role="button"
                tabIndex={0}
                onClick={() =>
                  router.push(`/dashboard/lucro/dre?id=${sim.id}`)
                }
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    router.push(`/dashboard/lucro/dre?id=${sim.id}`);
                  }
                }}
              >
                {/* ESQUERDA */}
                <div className="lm-history-row__left">
                  <div className="lm-history-row__title">
                    {sim.nome ?? `Análise ${sim.id}`}
                  </div>

                  <div className="lm-history-row__meta">
                    {sim.created_at
                      ? new Date(sim.created_at).toLocaleString("pt-BR")
                      : ""}
                    {sim.arquivo_nome
                      ? ` • ${sim.arquivo_nome}`
                      : ""}
                  </div>
                </div>

                {/* DIREITA */}
                <div className="lm-history-row__right">
                  <div className="lm-history-pills">
                    <span
                      className={`lm-history-pill ${
                        lucro >= 0 ? "good" : "bad"
                      }`}
                    >
                      {brl(lucro)}
                    </span>

                    <span
                      className={`lm-history-pill ${toneMargem(margem)}`}
                    >
                      {margem.toFixed(1)}%
                    </span>
                  </div>

                  <div className="lm-history-row__link">
                    Abrir →
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* UPSELL */}
      <ProUpgradeButton
        title="Quer acompanhar sua evolução de forma consistente?"
        subtitle="No PRO você mantém histórico completo e toma decisões melhores ao longo do tempo."
      />

      {/* FOOTER */}
      <div className="lm-history-footer">
        Lucro ML • histórico •{" "}
        {new Date().toLocaleDateString("pt-BR")}
      </div>
    </div>
  );
}