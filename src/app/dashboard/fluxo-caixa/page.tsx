"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import UploadCaixa from "@/components/UploadCaixa";

type Result = { id?: string; nome?: string; arquivo_nome?: string; total_lancamentos?: number; error?: string };

export default function FluxoCaixaHome() {
  const router = useRouter();
  const [last, setLast] = useState<Result | null>(null);

  return (
    <div className="page-wrap">
      <section className="hero">
        <div className="hero-inner" style={{ gridTemplateColumns: "1.2fr .8fr" }}>
          <div>
            <div className="hero-badge">
              <span className="dot" />
              PRO • Fluxo de Caixa
            </div>

            <h1 style={{ fontSize: 28, marginTop: 12 }}>Fluxo de Caixa</h1>

            <p style={{ marginTop: 8 }}>
              Importe o extrato de repasses/MP do Mercado Livre e veja entradas, saídas e saldo por dia.
            </p>
          </div>

          <div className="actions" style={{ justifyContent: "flex-end", alignItems: "flex-start" }}>
            <button className="btn-dark" onClick={() => router.push("/dashboard")}>
              ← Painel
            </button>

            <button className="btn-primary" onClick={() => router.push("/dashboard/fluxo-caixa/historico")}>
              Histórico
            </button>
          </div>
        </div>
      </section>

      <section className="card-premium" style={{ padding: 16 }}>
       <UploadCaixa
  onResult={(data: any) => {
    const normalized: Result = {
      id: data?.id,
      nome: data?.nome,
      arquivo_nome: data?.arquivo_nome,
      total_lancamentos: data?.total_lancamentos,
      error: data?.error,
    };

    setLast(normalized);

    if (normalized.id) {
      router.push(`/dashboard/fluxo-caixa/relatorio?id=${normalized.id}`);
    }
  }}
/>

      </section>

      {last?.id ? (
        <section className="card-premium" style={{ padding: 18 }}>
          <h3 style={{ fontWeight: 950 }}>Último relatório importado</h3>
          <p className="muted" style={{ marginTop: 6 }}>
            {last.arquivo_nome ? <>Arquivo: <strong>{last.arquivo_nome}</strong></> : "Arquivo importado."}
            {typeof last.total_lancamentos === "number" ? <> • {last.total_lancamentos} lançamentos</> : null}
          </p>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => router.push(`/dashboard/fluxo-caixa/relatorio?id=${last.id}`)}>
              Abrir relatório →
            </button>
            <button className="btn" onClick={() => router.push("/dashboard/fluxo-caixa/historico")}>
              Ver histórico
            </button>
          </div>
        </section>
      ) : null}

      <div className="small" style={{ textAlign: "center" }}>
        Lucro ML • PRO • {new Date().toLocaleDateString("pt-BR")}
      </div>
    </div>
  );
}
