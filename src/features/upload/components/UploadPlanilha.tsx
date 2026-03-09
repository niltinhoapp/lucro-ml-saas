"use client";

import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type Dre = {
  receitaTotal: number;
  custoProdutos: number;
  taxas: number;
  logistica: number;
  lucro: number;
  margem: number;
};

export type UploadResult = {
  dre?: Dre;
  id?: string;
  nome?: string;
  message?: string;
  arquivo_nome?: string | null;

  avisos?: string[];

  camposDetectados?: Record<string, string>;
  camposIgnorados?: string[];
  sheetHeaders?: string[];
  headersNormalizados?: string[];
  totalLinhasBrutas?: number;
  totalLinhasValidas?: number;
  headerIdx?: number;
  sheetName?: string;
};

type Props = {
  onResult: (data: UploadResult) => void;
};

type Status = "idle" | "uploading" | "success" | "error";

type ApiErrorPayload = {
  error?: string;
  message?: string;
  max?: number;
};

export default function UploadPlanilha({ onResult }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [fileName, setFileName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(0);

  const hint = useMemo(() => {
    if (status === "uploading") return `Processando… ${progress}%`;
    if (status === "success") return "Planilha processada com sucesso. Abrindo o relatório…";
    if (status === "error") return errorMsg || "Falha ao processar o arquivo.";
    return "Formatos suportados: .xlsx e .csv";
  }, [status, errorMsg, progress]);

  function resetUI() {
    setStatus("idle");
    setErrorMsg("");
    setProgress(0);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function startFakeProgress() {
    setProgress(0);
    let p = 0;

    // sobe até 92% enquanto espera a API
    const t = window.setInterval(() => {
      p += Math.max(1, Math.floor((92 - p) * 0.08));
      if (p >= 92) p = 92;
      setProgress(p);
    }, 180);

    return () => window.clearInterval(t);
  }

  async function readJsonSafe(res: Response) {
    try {
      return (await res.json()) as UploadResult & ApiErrorPayload;
    } catch {
      return {} as UploadResult & ApiErrorPayload;
    }
  }

  function goCheckout(reason: "expired" | "limit", max?: number) {
    const qs = reason === "limit" ? `?reason=limit&max=${max ?? 3}` : `?reason=expired`;
    router.push(`/checkout${qs}`);
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

      const res = await fetch("/api/upload-planilha", {
        method: "POST",
        body: form,
      });

      // ✅ trata respostas especiais antes de "throw"
      if (res.status === 401) {
        stop();
        setStatus("error");
        setProgress(0);
        setErrorMsg("Você precisa entrar para importar planilhas.");
        router.push("/login?reason=auth");
        e.target.value = "";
        return;
      }

      if (res.status === 402) {
        const j = await readJsonSafe(res);
        stop();
        setStatus("error");
        setProgress(0);
        setErrorMsg(j?.message || "Seu teste grátis terminou. Desbloqueie o PRO para continuar.");
        goCheckout("expired");
        e.target.value = "";
        return;
      }

      if (res.status === 403) {
        const j = await readJsonSafe(res);
        stop();
        setStatus("error");
        setProgress(0);

        if (j?.error === "limit_reached") {
          const max = j?.max ?? 3;
          setErrorMsg(`Limite do teste grátis atingido (${max} relatórios). Assine o PRO para relatórios ilimitados.`);
          goCheckout("limit", max);
        } else {
          setErrorMsg(j?.message || "Ação não permitida no seu plano.");
        }

        e.target.value = "";
        return;
      }

      const data = await readJsonSafe(res);

      if (!res.ok) {
        stop();
        setStatus("error");
        setProgress(0);
        setErrorMsg(data?.error || data?.message || "Erro no upload.");
        e.target.value = "";
        return;
      }

      stop();
      setProgress(100);
      setStatus("success");

      const payload: UploadResult = {
        ...data,
        arquivo_nome: data?.arquivo_nome ?? file.name,
        message: data?.message ?? "Upload concluído. Abrindo o relatório…",
      };

      // ✅ blindagem contra "onResult is not a function"
      if (typeof onResult === "function") onResult(payload);

      // permite reenviar o mesmo arquivo
      e.target.value = "";
    } catch (err: any) {
      stop();
      setStatus("error");
      setProgress(0);
      setErrorMsg(err?.message || "Falha ao processar a planilha.");
      e.target.value = "";
    }
  }

  return (
    <div className="drop">
      <div className="drop-top">
        <div className="drop-left">
          <div className="drop-title">Importar planilha do Mercado Livre</div>

          <div className="drop-file">
            {fileName ? (
              <>
                Arquivo selecionado: <strong>{fileName}</strong>
              </>
            ) : (
              "Nenhum arquivo escolhido"
            )}
          </div>

          <div
            className={[
              "drop-hint",
              status === "uploading"
                ? "hint-uploading"
                : status === "success"
                ? "hint-success"
                : status === "error"
                ? "hint-error"
                : "hint-idle",
            ].join(" ")}
          >
            {hint}
          </div>
        </div>

        <div className="drop-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => inputRef.current?.click()}
            disabled={status === "uploading"}
            style={{ opacity: status === "uploading" ? 0.7 : 1 }}
          >
            {status === "uploading" ? "Processando…" : "Escolher arquivo"}
          </button>

          {(status === "success" || status === "error") && (
            <button type="button" className="btn-ghost" onClick={resetUI}>
              Limpar
            </button>
          )}

          <span className="badge pro">⚡ PRO</span>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.csv"
        aria-label="Enviar planilha (.xlsx ou .csv)"
        onChange={handleChange}
        style={{ display: "none" }}
      />

      {status === "uploading" && (
        <div className="progress-wrap">
          <div className="progress">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="alert danger" style={{ marginTop: 12 }}>
          {errorMsg}
          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-primary" onClick={() => router.push("/checkout")}>
              Desbloquear PRO
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => router.push("/demo")}>
              Ver demo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}