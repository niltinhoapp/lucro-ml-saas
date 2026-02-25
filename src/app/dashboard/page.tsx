"use client";

import { useRouter } from "next/navigation";
import UploadPlanilha from "@/components/UploadPlanilha";
import type { UploadResult } from "@/components/UploadPlanilha";

export default function DashboardHome() {
  const router = useRouter();

  function handleResult(data: UploadResult) {
    // ✅ aqui fica a navegação (a Home decide para onde ir)
    if (data?.id) {
      router.push(`/dashboard/dre?id=${data.id}`);
      return;
    }

    // se não veio id (não deveria), cai pro histórico
    router.push("/dashboard/historico");
  }

  return (
    <div className="page-wrap">
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-badge">
              <span className="dot" />
              Lucro ML — Inteligência de Margem
            </div>

            <h1>DRE Automático</h1>

            <p>
              Faça upload da planilha do Mercado Livre e gere um relatório DRE automático,
              com alertas e insights prontos para decisão.
            </p>

            <div className="kpis">
              <div className="kpi">
                <div className="label">⚡ Upload PRO</div>
                <div className="value">Processamento automático</div>
              </div>
              <div className="kpi">
                <div className="label">Compatível</div>
                <div className="value">.xlsx e .csv</div>
              </div>
              <div className="kpi">
                <div className="label">Relatório</div>
                <div className="value">Abre sozinho no DRE</div>
              </div>
            </div>
          </div>

          <div className="hero-features">
            <div className="feature">
              <div className="t">Upload simples</div>
              <div className="d">Sem campos, sem confusão. Só subir e pronto.</div>
            </div>
            <div className="feature">
              <div className="t">Diagnóstico do arquivo</div>
              <div className="d">Mostra colunas reconhecidas e avisos do que faltou.</div>
            </div>
            <div className="feature">
              <div className="t">Decisão rápida</div>
              <div className="d">Margem, lucro e alertas em um relatório limpo.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Importar planilha</h2>
            <p>Envie sua planilha e abra o DRE automaticamente.</p>
          </div>

          <div className="actions">
            <button
              type="button"
              className="btn-dark"
              onClick={() => router.push("/dashboard/historico")}
            >
              Histórico de simulações
            </button>
          </div>
        </div>

        <div className="card-body">
          <UploadPlanilha onResult={handleResult} />
        </div>
      </section>

      <div className="small" style={{ textAlign: "center" }}>
        © {new Date().getFullYear()} Lucro ML • PRO
      </div>
    </div>
  );
}
