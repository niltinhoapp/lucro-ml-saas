"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AnalysisStatus = "concluido" | "processando" | "erro";

type HistoryItem = {
  id: string;
  product: string;
  origin: string;
  date: string;
  status: AnalysisStatus;
};

type OpportunityLevel = "Alto" | "Médio" | "Baixo";
type RiskLevel = "Baixo" | "Moderado" | "Alto";
type CompetitionLevel = "Baixa" | "Média" | "Alta";

type AnalysisResult = {
  title: string;
  potential: OpportunityLevel;
  risk: RiskLevel;
  competition: CompetitionLevel;
  marginText: string;
  summary: string;
  attentionPoints: string[];
  positiveSignals: string[];
  catalogName: string;
  itemsFound: number;
  mode: string;
};

const HISTORY_KEY = "lucro_ml_inteligencia_history";

const defaultResult: AnalysisResult = {
  title: "Leitura do catálogo",
  potential: "Médio",
  risk: "Moderado",
  competition: "Média",
  marginText: "Sem faixa estimada",
  summary:
    "Envie um catálogo em PDF para organizar os principais sinais e destacar o que merece sua atenção.",
  attentionPoints: [
    "Valide preço de compra",
    "Confirme frete e taxas",
    "Revise concorrência real antes de decidir",
  ],
  positiveSignals: [
    "Leitura centralizada do arquivo",
    "Resumo prático para decisão",
    "Histórico salvo nesta tela",
  ],
  catalogName: "Catálogo",
  itemsFound: 0,
  mode: "idle",
};

function formatDateBR(date = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function getStatusLabel(status: AnalysisStatus) {
  if (status === "concluido") return "Concluído";
  if (status === "processando") return "Processando";
  return "Erro";
}

function getStatusClass(status: AnalysisStatus) {
  if (status === "concluido") return "intel-status intel-status--success";
  if (status === "processando") return "intel-status intel-status--warning";
  return "intel-status intel-status--danger";
}

function normalizePotential(value: unknown): OpportunityLevel {
  if (typeof value === "number") {
    if (value >= 75) return "Alto";
    if (value <= 40) return "Baixo";
    return "Médio";
  }

  const text = String(value ?? "").toLowerCase();

  if (
    text.includes("alto") ||
    text.includes("high") ||
    text.includes("worth") ||
    text.includes("oportunidade_real")
  ) {
    return "Alto";
  }

  if (
    text.includes("baixo") ||
    text.includes("low") ||
    text.includes("evitar")
  ) {
    return "Baixo";
  }

  return "Médio";
}

function normalizeRisk(value: unknown): RiskLevel {
  if (typeof value === "number") {
    if (value <= 35) return "Baixo";
    if (value >= 70) return "Alto";
    return "Moderado";
  }

  const text = String(value ?? "").toLowerCase();

  if (text.includes("baixo") || text.includes("low")) return "Baixo";
  if (text.includes("alto") || text.includes("high") || text.includes("grave")) {
    return "Alto";
  }

  return "Moderado";
}

function normalizeCompetition(value: unknown): CompetitionLevel {
  if (typeof value === "number") {
    if (value <= 35) return "Baixa";
    if (value >= 70) return "Alta";
    return "Média";
  }

  const text = String(value ?? "").toLowerCase();

  if (text.includes("baixa") || text.includes("baixo") || text.includes("low")) {
    return "Baixa";
  }

  if (text.includes("alta") || text.includes("alto") || text.includes("high")) {
    return "Alta";
  }

  return "Média";
}

function normalizeMargin(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();

  if (typeof value === "number") {
    return `${value.toFixed(1)}%`;
  }

  if (
    value &&
    typeof value === "object" &&
    "min" in value &&
    "max" in value &&
    typeof (value as { min?: unknown }).min === "number" &&
    typeof (value as { max?: unknown }).max === "number"
  ) {
    const margin = value as { min: number; max: number };
    return `${margin.min.toFixed(1)}% - ${margin.max.toFixed(1)}%`;
  }

  return "Sem faixa estimada";
}

function normalizeTextArray(value: unknown, fallback: string[]) {
  if (Array.isArray(value)) {
    const list = value
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);

    if (list.length > 0) return list;
  }

  return fallback;
}

function fileNameWithoutExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "");
}

function normalizeApiResult(raw: unknown, fileName: string): AnalysisResult {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const rows = Array.isArray(data.rows)
    ? (data.rows as Array<Record<string, unknown>>)
    : [];

  const firstRow = rows[0] ?? {};

  const aiSummary =
    data.aiSummary && typeof data.aiSummary === "object"
      ? (data.aiSummary as Record<string, unknown>)
      : {};

  const mode = String(data.mode ?? "unknown");
  const catalogName = fileNameWithoutExtension(fileName);
  const itemsFound = rows.length;

  const firstProductName = String(
    firstRow.productName ??
      firstRow.raw_name ??
      firstRow.normalized_name ??
      catalogName
  );

  const potential = normalizePotential(
    firstRow.opportunityScore ??
      firstRow.worthBuying ??
      aiSummary.opportunity ??
      aiSummary.scoreLabel
  );

  const risk = normalizeRisk(
    firstRow.riskLevel ??
      firstRow.risk_score ??
      aiSummary.riskLevel ??
      aiSummary.risco
  );

  const competition = normalizeCompetition(
    firstRow.competitionScore ??
      aiSummary.competition ??
      aiSummary.concorrencia
  );

  const marginText = normalizeMargin(
    firstRow.estimatedMargin ??
      aiSummary.estimatedMargin ??
      aiSummary.marginRange
  );

  const summary =
    itemsFound > 0
      ? `Catálogo processado com ${itemsFound} item(ns). A leitura inicial destaca ${firstProductName} como referência para revisão.`
      : mode === "structured"
        ? "O catálogo foi processado e organizado para revisão."
        : "O arquivo foi recebido, mas ainda precisa de revisão para consolidar a leitura.";

  const attentionPoints =
    itemsFound > 0
      ? normalizeTextArray(
          firstRow.notes ? [String(firstRow.notes)] : [],
          [
            "Valide preço de compra antes da decisão",
            "Confirme frete e taxas no cenário real",
            "Revise a concorrência do item principal",
          ]
        )
      : [
          "Arquivo sem estrutura totalmente confiável",
          "Revise nomes e preços antes de decidir",
          "Use a leitura como apoio inicial",
        ];

  const positiveSignals =
    itemsFound > 0
      ? [
          `${itemsFound} item(ns) identificado(s) no catálogo`,
          `Modo de leitura: ${mode}`,
          `Linhas processadas: ${String(aiSummary.parsedRows ?? itemsFound)}`,
        ]
      : [
          "Arquivo recebido com sucesso",
          "Catálogo salvo no histórico",
          "Leitura disponível para revisão",
        ];

  return {
    title: "Leitura do catálogo",
    potential,
    risk,
    competition,
    marginText,
    summary,
    attentionPoints,
    positiveSignals,
    catalogName,
    itemsFound,
    mode,
  };
}

export default function InteligenciaView() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFileName, setCurrentFileName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as HistoryItem[];
      if (Array.isArray(parsed)) {
        setHistory(parsed);
      }
    } catch {
      localStorage.removeItem(HISTORY_KEY);
    }
  }, []);

  function persistHistory(items: HistoryItem[]) {
    setHistory(items);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  }

  function addHistoryItem(item: HistoryItem) {
    setHistory((current) => {
      const next = [item, ...current].slice(0, 10);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }

  function updateHistoryItem(id: string, status: AnalysisStatus) {
    setHistory((current) => {
      const next = current.map((item) =>
        item.id === id ? { ...item, status } : item
      );
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }

  function openPdfPicker() {
    fileInputRef.current?.click();
  }

  async function handlePdfChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Selecione um arquivo PDF válido.");
      return;
    }

    const id = crypto.randomUUID();
    const catalogName = fileNameWithoutExtension(file.name);

    setErrorMessage("");
    setCurrentFileName(file.name);
    setIsLoading(true);

    addHistoryItem({
      id,
      product: catalogName,
      origin: "Catálogo",
      date: formatDateBR(),
      status: "processando",
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/catalogos/analisar", {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      let parsed: unknown = {};

      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        parsed = { message: text };
      }

      if (!response.ok) {
        const data = (parsed && typeof parsed === "object" ? parsed : {}) as {
          error?: string;
          message?: string;
        };

        throw new Error(
          data.error ||
            data.message ||
            "Não foi possível concluir a análise agora."
        );
      }

      const payload =
        parsed && typeof parsed === "object" && "result" in parsed
          ? (parsed as { result?: unknown }).result
          : parsed;

      const normalized = normalizeApiResult(payload, file.name);

      setResult(normalized);
      updateHistoryItem(id, "concluido");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao processar o arquivo.";

      setErrorMessage(message);
      updateHistoryItem(id, "erro");
    } finally {
      setIsLoading(false);
    }
  }

  const visibleResult = useMemo(() => result ?? defaultResult, [result]);

  return (
    <div className="intel-page">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={handlePdfChange}
      />

      <section className="intel-hero">
        <div className="intel-hero__content">
          <span className="intel-eyebrow">Leitura prática</span>
          <h1 className="intel-title">Inteligência</h1>
          <p className="intel-subtitle">
            Envie um catálogo e receba uma leitura mais organizada dos itens,
            riscos e pontos que merecem atenção.
          </p>
        </div>

        <div className="intel-hero__actions">
          <button type="button" className="btn btn-primary" onClick={openPdfPicker}>
            Nova análise
          </button>
        </div>
      </section>

      <section className="intel-actions">
        <article className="intel-card intel-card--action">
          <div className="intel-card__header">
            <h3>Enviar catálogo</h3>
            <span className="intel-chip">PDF</span>
          </div>
          <p>
            Leia arquivos de fornecedor e destaque itens que merecem atenção.
          </p>
          <button type="button" className="btn btn-secondary" onClick={openPdfPicker}>
            Selecionar PDF
          </button>
        </article>

        <article className="intel-card intel-card--action intel-card--muted">
          <div className="intel-card__header">
            <h3>Enviar planilha</h3>
            <span className="intel-chip">Em breve</span>
          </div>
          <p>
            Organize produtos e encontre padrões de margem, risco e potencial.
          </p>
          <button type="button" className="btn btn-secondary" disabled>
            Em preparação
          </button>
        </article>

        <article className="intel-card intel-card--action intel-card--muted">
          <div className="intel-card__header">
            <h3>Resumo do catálogo</h3>
            <span className="intel-chip">Leitura</span>
          </div>
          <p>
            Veja rapidamente quantos itens foram identificados e o cenário inicial.
          </p>
          <button type="button" className="btn btn-secondary" disabled>
            Disponível abaixo
          </button>
        </article>

        <article className="intel-card intel-card--action intel-card--muted">
          <div className="intel-card__header">
            <h3>Histórico</h3>
            <span className="intel-chip">Sessão</span>
          </div>
          <p>
            Acompanhe as análises recentes realizadas nesta tela.
          </p>
          <button type="button" className="btn btn-secondary" disabled>
            Disponível abaixo
          </button>
        </article>
      </section>

      {isLoading && (
        <section className="intel-feedback intel-feedback--loading">
          <strong>Processando catálogo</strong>
          <p>
            {currentFileName
              ? `Organizando a leitura de ${currentFileName}.`
              : "Organizando a leitura do arquivo."}
          </p>
        </section>
      )}

      {errorMessage && (
        <section className="intel-feedback intel-feedback--error">
          <strong>Não foi possível concluir agora</strong>
          <p>{errorMessage}</p>
        </section>
      )}

      <section className="intel-panel">
        <div className="intel-panel__top">
          <div>
            <span className="intel-eyebrow">
              {result ? "Resultado recente" : "Estado inicial"}
            </span>
            <h2>{visibleResult.title}</h2>
          </div>

          <div className="intel-panel__meta">
            <span
              className={
                visibleResult.potential === "Alto"
                  ? "intel-status intel-status--success"
                  : visibleResult.potential === "Baixo"
                    ? "intel-status intel-status--danger"
                    : "intel-status intel-status--warning"
              }
            >
              {result ? `${visibleResult.potential} potencial` : "Aguardando análise"}
            </span>
          </div>
        </div>

        <div className="intel-summary">
          <article className="intel-card">
            <h4>Resumo da leitura</h4>
            <p>{visibleResult.summary}</p>
          </article>
        </div>

        <div className="intel-metrics">
          <article className="intel-metric intel-metric--positive">
            <span className="intel-metric__label">Potencial</span>
            <strong>{visibleResult.potential}</strong>
          </article>

          <article className="intel-metric intel-metric--warning">
            <span className="intel-metric__label">Risco</span>
            <strong>{visibleResult.risk}</strong>
          </article>

          <article className="intel-metric">
            <span className="intel-metric__label">Concorrência</span>
            <strong>{visibleResult.competition}</strong>
          </article>

          <article className="intel-metric">
            <span className="intel-metric__label">Margem estimada</span>
            <strong>{visibleResult.marginText}</strong>
          </article>
        </div>

        <div className="intel-metrics intel-metrics--secondary">
          <article className="intel-metric">
            <span className="intel-metric__label">Catálogo</span>
            <strong>{visibleResult.catalogName}</strong>
          </article>

          <article className="intel-metric">
            <span className="intel-metric__label">Itens identificados</span>
            <strong>{visibleResult.itemsFound}</strong>
          </article>

          <article className="intel-metric">
            <span className="intel-metric__label">Modo</span>
            <strong>{visibleResult.mode}</strong>
          </article>

          <article className="intel-metric">
            <span className="intel-metric__label">Origem</span>
            <strong>PDF</strong>
          </article>
        </div>

        <div className="intel-columns">
          <article className="intel-card">
            <h4>Pontos de atenção</h4>
            <ul className="intel-list">
              {visibleResult.attentionPoints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="intel-card">
            <h4>Sinais positivos</h4>
            <ul className="intel-list">
              {visibleResult.positiveSignals.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="intel-history">
        <div className="intel-history__header">
          <div>
            <span className="intel-eyebrow">Histórico</span>
            <h3>Análises recentes</h3>
          </div>
        </div>

        <div className="intel-table-wrap">
          <table className="intel-table">
            <thead>
              <tr>
                <th>Catálogo</th>
                <th>Origem</th>
                <th>Data</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="intel-table__empty">
                    Nenhuma análise ainda.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product}</td>
                    <td>{item.origin}</td>
                    <td>{item.date}</td>
                    <td>
                      <span className={getStatusClass(item.status)}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}