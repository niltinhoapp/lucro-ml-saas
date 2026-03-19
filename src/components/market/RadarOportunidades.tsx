"use client";

import { useState } from "react";

type OpportunityItem = {
  nicho: string;
  demanda: "alta" | "média" | "baixa";
  concorrencia: "baixa" | "média" | "alta";
  preco_sugerido: number;
  ideia: string;
  diferencial: string;
};

type RadarResponse = {
  ok: true;
  traceId?: string;
  produto: string;
  oportunidades: OpportunityItem[];
};

type RadarErrorResponse = {
  ok?: false;
  error?: string;
  detail?: string;
  traceId?: string;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function getDemandBadgeClass(value: OpportunityItem["demanda"]) {
  if (value === "alta") return "success";
  if (value === "média") return "info";
  return "warn";
}

function getCompetitionBadgeClass(value: OpportunityItem["concorrencia"]) {
  if (value === "baixa") return "success";
  if (value === "média") return "info";
  return "warn";
}

function buildRadarErrorMessage(
  payload: RadarErrorResponse | null,
  status: number
) {
  const base =
    payload?.error ||
    (status === 401
      ? "Faça login para usar o radar."
      : status === 403
      ? "Seu plano atual não permite usar o Radar."
      : "Não foi possível consultar o Radar agora.");

  return [
    base,
    payload?.detail ? `Detalhe: ${payload.detail}` : null,
    payload?.traceId ? `Trace: ${payload.traceId}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
}

export default function RadarOportunidades() {
  const [produto, setProduto] = useState("suporte celular moto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RadarResponse | null>(null);

  const oportunidades = data?.oportunidades ?? [];
  const principal = oportunidades[0] ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const termo = produto.trim();

    if (!termo) {
      setError("Informe um produto para consultar.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/opportunity-radar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ produto: termo }),
      });

      const json = (await res.json().catch(() => null)) as
        | RadarResponse
        | RadarErrorResponse
        | null;

      console.log("[Radar IA] status:", res.status);
      console.log("[Radar IA] resposta:", json);

      if (!res.ok) {
        throw new Error(
          buildRadarErrorMessage(json as RadarErrorResponse | null, res.status)
        );
      }

      setData(json as RadarResponse);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível consultar o Radar agora.";

      setError(message);
      console.error("[Radar IA] erro ao consultar:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrap" style={{ display: "grid", gap: 20 }}>
      <section className="card card-premium">
        <h1>Radar de oportunidades</h1>

        <p className="subtitle">
          Descubra nichos, ideias de produto e diferenciais com ajuda da IA.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}
        >
          <input
            value={produto}
            onChange={(e) => setProduto(e.target.value)}
            placeholder="Ex: suporte celular moto"
          />

          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Consultando..." : "Consultar radar"}
          </button>
        </form>

        {error && (
          <div
            className="alert error"
            style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          >
            {error}
          </div>
        )}
      </section>

      <section className="card card-premium">
        <h2>Melhor oportunidade encontrada</h2>

        {principal ? (
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <strong>{principal.nicho}</strong>
            </div>

            <div className="muted">{principal.ideia}</div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className={`badge ${getDemandBadgeClass(principal.demanda)}`}>
                Demanda: {principal.demanda}
              </span>

              <span
                className={`badge ${getCompetitionBadgeClass(
                  principal.concorrencia
                )}`}
              >
                Concorrência: {principal.concorrencia}
              </span>

              <span className="badge pro">
                Preço sugerido: {formatMoney(principal.preco_sugerido)}
              </span>
            </div>

            <div className="alert info">
              <strong>Diferencial sugerido:</strong> {principal.diferencial}
            </div>
          </div>
        ) : (
          <div className="alert info">
            Faça uma busca para encontrar oportunidades.
          </div>
        )}
      </section>

      <section className="card card-premium">
        <h2>Oportunidades para explorar</h2>

        {!oportunidades.length ? (
          <div className="alert info">
            Nenhuma oportunidade analisada ainda.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {oportunidades.map((item, index) => (
              <article
                key={`${item.nicho}-${index}`}
                className="market-trend-item"
                style={{
                  display: "grid",
                  gap: 8,
                  padding: 14,
                  borderRadius: 14,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <strong>{item.nicho}</strong>

                  <span className="badge pro">
                    {formatMoney(item.preco_sugerido)}
                  </span>
                </div>

                <div className="muted">{item.ideia}</div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className={`badge ${getDemandBadgeClass(item.demanda)}`}>
                    Demanda: {item.demanda}
                  </span>

                  <span
                    className={`badge ${getCompetitionBadgeClass(
                      item.concorrencia
                    )}`}
                  >
                    Concorrência: {item.concorrencia}
                  </span>
                </div>

                <div className="alert info" style={{ marginTop: 4 }}>
                  <strong>Diferencial:</strong> {item.diferencial}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}