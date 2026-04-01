"use client";

import { useState } from "react";

export default function CatalogUploadClient() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function upload() {
    if (!file) return;

    setLoading(true);
    setStatus("Enviando catálogo...");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/catalogs/upload", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Falha no upload.");
      }

      setJobId(data.jobId);
      setStatus(data.reused ? "Análise reaproveitada. Consultando..." : "Catálogo na fila de análise...");

      const interval = setInterval(async () => {
        const r = await fetch(`/api/catalogs/${data.jobId}`);
        const d = await r.json();

        if (!r.ok || !d.ok) {
          clearInterval(interval);
          setStatus("Falha ao consultar análise.");
          return;
        }

        if (d.job.status === "completed") {
          clearInterval(interval);
          setStatus(`Concluído. Produtos encontrados: ${d.rows.length}`);
        } else if (d.job.status === "failed") {
          clearInterval(interval);
          setStatus(`Falhou: ${d.job.error_message || "erro desconhecido"}`);
        } else {
          setStatus(`Status: ${d.job.status}`);
        }
      }, 3000);
    } catch (error: any) {
      setStatus(error?.message || "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-4 border rounded-2xl border-white/10 bg-white/5">
      <h3 className="text-xl font-semibold">Enviar catálogo com IA</h3>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full text-sm"
      />

      <button
        onClick={upload}
        disabled={!file || loading}
        className="px-4 py-2 text-white rounded-xl bg-emerald-600 disabled:opacity-50"
      >
        {loading ? "Enviando..." : "Analisar catálogo"}
      </button>

      {jobId ? <p className="text-sm opacity-80">Job: {jobId}</p> : null}
      {status ? <p className="text-sm">{status}</p> : null}
    </div>
  );
}




