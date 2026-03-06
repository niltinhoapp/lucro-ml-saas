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
    <div className="page-wrap dash-upload-page">
      {/* Topbar */}
      <section className="topbar dash-upload-topbar">
        <div className="dash-upload-left">
          <span className="badge pro">📊 DRE</span>

          <h2 className="dash-upload-title">DRE Automático</h2>
          <p className="subtitle">Envie a planilha e abra o relatório.</p>

          <div className="dash-upload-chips">
            <span className="pill">.xlsx</span>
            <span className="pill">.csv</span>
            <span className="pill good">Auto</span>
          </div>
        </div>

        <div className="actions dash-upload-actions">
          <button className="btn btn-ghost" onClick={() => router.push("/")}>🏠 Home</button>
          <button className="btn" onClick={() => router.push("/dashboard/historico")}>Histórico</button>
        </div>
      </section>

      {/* Ação principal */}
      <section className="card dash-upload-card">
        <div className="card-head dash-upload-card-head">
          <div>
            <h2>Importar planilha</h2>
            <p>Escolha o arquivo e pronto.</p>
          </div>

          <div className="actions">
            <span className="badge pro">⚡ PRO</span>
          </div>
        </div>

        <div className="card-body">
          <div className="drop dash-upload-drop">
            <div className="dash-drop-top">
              <div className="dash-drop-left">
                <div className="dash-drop-title">Planilha do Mercado Livre</div>
                <div className="dash-drop-file">Suporta .xlsx e .csv</div>
                <div className="dash-drop-hint">Após enviar, o DRE abre automaticamente.</div>
              </div>
            </div>

            <div className="dash-drop-uploader">
              <UploadPlanilha onResult={handleResult} />
            </div>
          </div>

          <details className="dash-upload-details">
            <summary>Como funciona</summary>
            <pre className="dash-upload-pre">
- Faz upload da planilha
- Normaliza colunas reconhecidas
- Gera DRE + margem + alertas
- Salva no histórico
            </pre>
          </details>
        </div>
      </section>

      <div className="small dash-upload-footer">
        © {new Date().getFullYear()} Lucro ML • PRO
      </div>
    </div>
  );
}