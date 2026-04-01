"use client";

import React, { useMemo, useRef, useState } from "react";

export type CaixaUploadResult = {
  id?: string;
  nome?: string;
  arquivo_nome?: string | null;
  total_lancamentos?: number;
  message?: string;
  error?: string;
};

type Props = {
  onResult: (data: CaixaUploadResult) => void;
};

type Status = "idle" | "uploading" | "success" | "error";

export default function UploadCaixa({ onResult }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [fileName, setFileName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(0);

  const hint = useMemo(() => {
    if (status === "uploading") return `Processando… ${progress}%`;
    if (status === "success") return "Extrato processado com sucesso.";
    if (status === "error") return errorMsg || "Falha ao processar o arquivo.";
    return "Formatos suportados: .xlsx e .csv";
  }, [status, errorMsg, progress]);

  function startFakeProgress() {
    setProgress(0);
    let p = 0;

    // sobe até 92% enquanto espera API
    const id = window.setInterval(() => {
      p += Math.max(1, Math.floor((92 - p) * 0.08));
      if (p >= 92) p = 92;
      setProgress(p);
    }, 180);

    return () => window.clearInterval(id);
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg("");
    setStatus("uploading");

    const stop = startFakeProgress();

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/caixa/upload", {
        method: "POST",
        body: form,
      });

      const data = (await res.json()) as CaixaUploadResult;

      if (!res.ok) {
        throw new Error(data?.error || "Erro no upload.");
      }

      stop();
      setProgress(100);
      setStatus("success");

      // ✅ payload padronizado
      const payload: CaixaUploadResult = {
        ...data,
        arquivo_nome: data.arquivo_nome ?? file.name,
        message: data.message ?? "Upload concluído. Abrindo o relatório…",
      };

      if (typeof onResult === "function") onResult(payload);

      // permite reenviar o mesmo arquivo
      e.target.value = "";
    } catch (err: any) {
      stop();
      setStatus("error");
      setErrorMsg(err?.message || "Falha ao processar o extrato.");
      setProgress(0);
    }
  }

  return (
    <div className="drop">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 260 }}>
          <div style={{ fontWeight: 950, marginBottom: 4 }}>Importar extrato de repasses</div>

          <div style={{ color: "rgba(229,231,235,.75)", fontSize: 12 }}>
            {fileName ? (
              <>
                Arquivo selecionado: <strong>{fileName}</strong>
              </>
            ) : (
              "Nenhum arquivo escolhido"
            )}
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              fontWeight: 900,
              color:
                status === "uploading"
                  ? "rgba(219,234,254,.95)"
                  : status === "success"
                  ? "rgba(220,252,231,.95)"
                  : status === "error"
                  ? "rgba(254,226,226,.95)"
                  : "rgba(229,231,235,.70)",
            }}
          >
            {hint}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => inputRef.current?.click()}
            disabled={status === "uploading"}
            style={{ opacity: status === "uploading" ? 0.7 : 1 }}
          >
            {status === "uploading" ? "Processando…" : "Escolher arquivo"}
          </button>

          <span className="badge pro">⚡ PRO</span>
        </div>
      </div>

      <input ref={inputRef} type="file" accept=".xlsx,.csv" onChange={handleChange} style={{ display: "none" }} />

      {status === "uploading" && (
        <div style={{ marginTop: 12 }}>
          <div className="progress">
  <div className="progress-bar" style={{ width: `${progress}%` }} />
</div>

        </div>
      )}

      {status === "error" && (
        <div className="alert danger" style={{ marginTop: 12 }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}



