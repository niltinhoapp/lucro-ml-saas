"use client";

import { useRouter } from "next/navigation";
import UploadPlanilha from "@/features/upload/components/UploadPlanilha";
import type { UploadResult } from "@/features/upload/components/UploadPlanilha";

export default function DashboardPage() {
  const router = useRouter();

  function handleResult(data: UploadResult) {
    if (data?.id) {
      router.push(`/dashboard/dre?id=${data.id}`);
      return;
    }
    router.push("/dashboard/historico");
  }

  return (
    <div className="page-wrap">
      {/* Topbar compacto (sem textão) */}
      <section className="topbar">
        <div>
          <span className="badge pro">📊 DRE</span>
          <h2 style={{ marginTop: 10 }}>DRE Automático</h2>
          <p className="subtitle">
            Envie a planilha e abra o relatório.
          </p>

          {/* chips (substitui cards explicativos) */}
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="pill">.xlsx</span>
            <span className="pill">.csv</span>
            <span className="pill good">Auto</span>
          </div>
        </div>

        <div className="actions">
          <button className="btn btn-ghost" onClick={() => router.push("/")}>
            🏠 Home
          </button>
          <button className="btn-dark" onClick={() => router.push("/dashboard/historico")}>
            Histórico
          </button>
        </div>
      </section>

      {/* AÇÃO PRINCIPAL PRIMEIRO (sem rolar) */}
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Importar planilha</h2>
            <p>Escolha o arquivo e pronto.</p>
          </div>

          <div className="actions">
            <span className="badge pro">⚡ PRO</span>
          </div>
        </div>

        <div className="card-body">
          <div className="drop">
            <div className="drop-top">
              <div className="drop-left">
                <div className="drop-title">Planilha do Mercado Livre</div>
                <div className="drop-file">Suporta .xlsx e .csv</div>
                <div className="drop-hint hint-idle">Após enviar, o DRE abre automaticamente.</div>
              </div>

              <div className="drop-actions" />
            </div>

            <div style={{ marginTop: 12 }}>
              <UploadPlanilha onResult={handleResult} />
            </div>
          </div>

          {/* Ajuda colapsada (não polui tela pequena) */}
          <details style={{ marginTop: 12 }}>
            <summary>Como funciona</summary>
            <pre>
- Faz upload da planilha
- Normaliza colunas reconhecidas
- Gera DRE + margem + alertas
- Salva no histórico
            </pre>
          </details>
        </div>
      </section>

      <div className="small" style={{ textAlign: "center" }}>
        © {new Date().getFullYear()} Lucro ML • PRO
      </div>
    </div>
  );
}
