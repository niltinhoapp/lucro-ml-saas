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

          <div className="dash2-kicker">Painel</div>

          <h1 className="dash2-title">
            Lucro ML — Inteligência de Margem
          </h1>

          <p className="dash2-subtitle">
            DRE automático, comparação FULL vs FLEX e decisões baseadas em dados do
            Mercado Livre.
          </p>
        </div>

        <div className="dash2-head-right">
          <span className={`dash2-status ${lastUpload?.id ? "ok" : ""}`}>
            <span className="dash2-dot" aria-hidden />
            {lastUpload?.id ? "Upload salvo" : "Pronto para importar"}
          </span>
        </div>
      </header>

      <section className="dash2-surface">
        <div className="dash2-strip" role="list">
          <StripItem
            title="DRE automático"
            desc="Receita, custos, taxas, lucro e margem."
          />
          <StripItem
            title="Full vs Flex"
            desc="Compare cenários logísticos por unidade."
          />
          <StripItem
            title="Histórico & PDF"
            desc="Reabrir relatórios e exportar (PRO)."
          />
        </div>

        <div className="dash2-section">
          <div className="dash2-section-head">
            <div>
              <h2 className="dash2-h2">Importar planilha</h2>
              <p className="dash2-muted">
                Envie CSV ou Excel (.xlsx). Resultado em segundos.
              </p>
            </div>

            <span className={`dash2-pill ${lastUpload?.id ? "good" : "info"}`}>
              {lastUpload?.id ? "✅ salvo" : "⚡ pro"}
            </span>
          </div>

          <div className="dash2-upload">
            <UploadPlanilha onResult={(data) => setLastUpload(data)} />
          </div>

          {lastUpload?.message ? (
            <div className="dash2-note">
              <span className="dash2-note-label">Status</span>
              <span className="dash2-note-text">{lastUpload.message}</span>
            </div>
          ) : null}
        </div>

        <div className="dash2-divider" />

        <div className="dash2-section">
          <div className="dash2-section-head">
            <div>
              <h2 className="dash2-h2">Histórico</h2>
              <p className="dash2-muted">Últimos relatórios salvos.</p>
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