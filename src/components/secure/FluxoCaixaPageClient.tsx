"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import UploadCaixa from "@/features/upload/components/UploadCaixa";

type Result = {
  id?: string;
  nome?: string;
  arquivo_nome?: string;
  total_lancamentos?: number;
  error?: string;
};

export default function FluxoCaixaPageClient() {
  const router = useRouter();
  const [last, setLast] = useState<Result | null>(null);

  return (
    <div className="page-wrap">
      <section className="hero">
        <div className="hero-inner" style={{ gridTemplateColumns: "1.2fr .8fr" }}>
          <div>
            <div className="hero-badge">
              <span className="dot" />
              PRO • Fluxo de caixa
            </div>

            <h1 style={{ fontSize: 28, marginTop: 12 }}>
              Importe o extrato e veja a saúde do seu caixa
            </h1>

            <p style={{ marginTop: 8 }}>
              Envie o extrato da operação para organizar entradas, saídas e saldo
              do período sem depender de planilhas manuais.
            </p>
          </div>

          <div
            className="actions"
            style={{ justifyContent: "flex-end", alignItems: "flex-start" }}
          >
            <button className="btn-dark" onClick={() => router.push("/dashboard")}>
              ← Voltar ao painel
            </button>

            <button
              className="btn-primary"
              onClick={() => router.push("/dashboard/lucro/fluxo-caixa/historico")}
            >
              Ver histórico
            </button>
          </div>
        </div>
      </section>

      <section className="card-premium" style={{ padding: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900 }}>Enviar extrato</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            Depois da importação, o Lucro ML organiza os lançamentos e direciona
            você para o relatório com a leitura do período.
          </p>
        </div>

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
              router.push(`/dashboard/lucro/fluxo-caixa/relatorio?id=${normalized.id}`);
            }
          }}
        />
      </section>

      {last?.id ? (
        <section className="card-premium" style={{ padding: 18 }}>
          <h3 style={{ fontWeight: 950 }}>Última importação concluída</h3>

          <p className="muted" style={{ marginTop: 6 }}>
            {last.arquivo_nome ? (
              <>
                Arquivo: <strong>{last.arquivo_nome}</strong>
              </>
            ) : (
              "Arquivo importado com sucesso."
            )}
            {typeof last.total_lancamentos === "number" ? (
              <> • {last.total_lancamentos} lançamentos organizados</>
            ) : null}
          </p>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="btn-primary"
              onClick={() => router.push(`/dashboard/lucro/fluxo-caixa/relatorio?id=${last.id}`)}
            >
              Abrir relatório →
            </button>

            <button
              className="btn"
              onClick={() => router.push("/dashboard/lucro/fluxo-caixa/historico")}
            >
              Ver histórico
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}




