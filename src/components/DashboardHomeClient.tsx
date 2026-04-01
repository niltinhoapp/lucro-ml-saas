"use client";

import { useState } from "react";
import UploadPlanilha, { type UploadResult } from "@/features/upload/components/UploadPlanilha";
import HistoricoSimulacoes, { type Simulacao } from "@/components/HistoricoSimulacoes";

export default function DashboardHomeClient({
  simulacoes,
}: {
  simulacoes: Simulacao[];
}) {
  const [lastUpload, setLastUpload] = useState<UploadResult | null>(null);

  return (
    <div className="dash2">
      <header className="dash2-head">
        <div className="dash2-head-copy">
          <div className="dash2-head-glow" aria-hidden />

          <div className="dash2-kicker">Central de decisão</div>

          <h1 className="dash2-title">
            Entenda seu lucro real no Mercado Livre
          </h1>

          <p className="dash2-subtitle">
            Envie sua planilha e descubra com mais clareza quanto sobra nas vendas,
            onde sua margem está apertada e quais decisões podem melhorar seu resultado.
          </p>
        </div>

        <div className="dash2-head-right">
          <span className={`dash2-status ${lastUpload?.id ? "ok" : ""}`}>
            <span className="dash2-dot" aria-hidden />
            {lastUpload?.id ? "Planilha analisada" : "Pronto para analisar"}
          </span>
        </div>
      </header>

      <section className="dash2-surface">
        <div className="dash2-strip" role="list">
          <StripItem
            title="Lucro real da operação"
            desc="Veja receita, custos, taxas e margem com mais clareza."
          />
          <StripItem
            title="Comparação Full vs Flex"
            desc="Entenda qual logística tende a deixar mais lucro."
          />
          <StripItem
            title="Histórico das análises"
            desc="Reabra resultados anteriores e acompanhe sua evolução."
          />
        </div>

        <div className="dash2-section">
          <div className="dash2-section-head">
            <div>
              <h2 className="dash2-h2">Analisar planilha de vendas</h2>
              <p className="dash2-muted">
                Envie CSV ou Excel (.xlsx) para identificar lucro, custos e pontos que merecem atenção.
              </p>
            </div>

            <span className={`dash2-pill ${lastUpload?.id ? "good" : "info"}`}>
              {lastUpload?.id ? "Análise concluída" : "Plano PRO"}
            </span>
          </div>

          <div className="dash2-upload">
            <UploadPlanilha onResult={(data) => setLastUpload(data)} />
          </div>

          {lastUpload?.message ? (
            <div className="dash2-note">
              <span className="dash2-note-label">Resultado</span>
              <span className="dash2-note-text">{lastUpload.message}</span>
            </div>
          ) : null}
        </div>

        <div className="dash2-divider" />

        <div className="dash2-section">
          <div className="dash2-section-head">
            <div>
              <h2 className="dash2-h2">Análises salvas</h2>
              <p className="dash2-muted">
                Revise relatórios anteriores e compare decisões já feitas na operação.
              </p>
            </div>
          </div>

          <div className="dash2-history">
            <HistoricoSimulacoes simulacoes={simulacoes} />
          </div>
        </div>
      </section>
    </div>
  );
}

function StripItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="dash2-strip-item" role="listitem">
      <div className="dash2-strip-title">{title}</div>
      <div className="dash2-strip-desc">{desc}</div>
    </div>
  );
}

