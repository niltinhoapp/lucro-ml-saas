"use client";

import { useMemo, useState } from "react";
import UploadPlanilha, { UploadResult } from "@/components/UploadPlanilha";
import DreResumo from "@/components/DreResumo";
import ExportarPDF from "@/components/ExportarPDF";
import DreInsights from "@/components/DreInsights";
import { gerarInsightsDre } from "@/lib/dre/insights";

function moeda(v: number) {
  return Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function DrePage() {
  const [result, setResult] = useState<UploadResult | null>(null);

  const dre = result?.dre ?? null;

  const totalDespesas = useMemo(() => {
    if (!dre) return 0;
    return (
      Number(dre.custoProdutos || 0) +
      Number(dre.taxas || 0) +
      Number(dre.logistica || 0)
    );
  }, [dre]);

  const insights = useMemo(() => {
    if (!dre) return [];
    return gerarInsightsDre(dre); // aqui só roda se dre existir
  }, [dre]);

  const nomeRelatorio = useMemo(() => {
    // Preferência: nome vindo do servidor
    if (result?.nome) return result.nome;

    // Fallback: baseado no id
    if (result?.id) return `Simulação #${result.id.slice(0, 6).toUpperCase()}`;

    return "Simulação";
  }, [result?.nome, result?.id]);

  return (
    <div className="page">
      {/* HEADER PRO */}
      <div className="topbar">
        <div>
          <h2>DRE Automático</h2>
          <p className="subtitle">
            Envie a planilha do Mercado Livre e receba um diagnóstico de lucro,
            margem e alertas automáticos.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <span className="badge pro">⚡ Upload PRO</span>
          {dre && <span className="badge">✅ Processado</span>}
        </div>
      </div>

      {/* UPLOAD */}
      <section className="card-premium">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "0.25rem" }}>
              Importar planilha
            </h3>
            <p className="muted">
              Formatos suportados: <strong>.xlsx</strong> e <strong>.csv</strong>.
              O arquivo é transformado em DRE automaticamente.
            </p>
          </div>

          <div style={{ minWidth: 220, display: "flex", justifyContent: "flex-end" }}>
            {dre ? (
              <span className="alert success" style={{ alignSelf: "center" }}>
                ✅ DRE pronto
              </span>
            ) : (
              <span className="alert info" style={{ alignSelf: "center" }}>
                ⬆️ Envie para calcular
              </span>
            )}
          </div>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <UploadPlanilha onResult={(data) => setResult(data)} />
        </div>

        {result?.message && (
          <div className="alert info" style={{ marginTop: "1rem" }}>
            {result.message}
          </div>
        )}
      </section>

      {/* RESULTADOS */}
      {dre ? (
        <>
          <section className="grid-3">
            <div className="summary-card">
              <p>Receita total</p>
              <div className="value">{moeda(dre.receitaTotal)}</div>
            </div>

            <div className="summary-card">
              <p>Custos + Taxas + Logística</p>
              <div className="value">{moeda(totalDespesas)}</div>
            </div>

            <div className="summary-card">
              <p>Margem</p>
              <div className="value">{Number(dre.margem || 0).toFixed(2)}%</div>
            </div>
          </section>

          <section className="card-premium">
            <DreResumo dre={dre} />
          </section>

          <section className="card-premium">
            <DreInsights insights={insights} />
          </section>

          <section className="card-premium">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.05rem", marginBottom: "0.25rem" }}>
                  Exportar relatório
                </h3>
                <p className="muted">
                  Baixe um PDF profissional com o resumo do DRE e indicadores.
                </p>
              </div>

              <div className="flex gap-3">
                <ExportarPDF nome={nomeRelatorio} dre={dre} />
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="alert info">
          💡 Dica: suba um arquivo de teste para ver cards, insights e exportação em PDF.
        </section>
      )}
    </div>
  );
}
