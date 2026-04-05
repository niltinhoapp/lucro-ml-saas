"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type CatalogRow = {
  productName?: string;
  supplierCost?: number;
  avgMlPrice?: number;
  estimatedMargin?: number;
  demandScore?: number;
  competitionScore?: number;
  opportunityScore?: number;
  riskLevel?: string;
  aiSummary?: string;
};

type CatalogSummary = {
  totalRows: number;
  parsedRows: number;
  promisingCount: number;
  reviewCount: number;
  riskyCount: number;
  avgMargin: number;
  avgOpportunity: number;
  extractionQuality: string;
  extractedTextPreview: string;
  highlights: string[];
};

type CatalogAnalysisResult = {
  fileName: string;
  mode: string;
  summary: CatalogSummary;
  rows: CatalogRow[];
};

type SavedCatalog = {
  id: string;
  title: string;
  file_name?: string | null;
  status?: string | null;
  items_count?: number | null;
  created_at?: string | null;
};

type Props = {
  initialResult?: unknown;
  savedCatalogs?: SavedCatalog[];
};

const EMPTY_SUMMARY: CatalogSummary = {
  totalRows: 0,
  parsedRows: 0,
  promisingCount: 0,
  reviewCount: 0,
  riskyCount: 0,
  avgMargin: 0,
  avgOpportunity: 0,
  extractionQuality: "baixa",
  extractedTextPreview: "",
  highlights: [],
};

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function brl(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function riskLabel(risk?: string) {
  const value = (risk ?? "").toLowerCase();

  if (value === "baixo" || value === "low") return "Baixo";
  if (value === "alto" || value === "high") return "Alto";
  return "Moderado";
}

function riskClass(risk?: string) {
  const value = (risk ?? "").toLowerCase();

  if (value === "baixo" || value === "low") return "lm-badge-success";
  if (value === "alto" || value === "high") return "lm-badge-danger";
  return "lm-badge-warning";
}

function qualityLabel(quality?: string) {
  const value = (quality ?? "").toLowerCase();

  if (value === "alta") return "Alta";
  if (value === "media" || value === "média") return "Média";
  return "Baixa";
}

function qualityClass(quality?: string) {
  const value = (quality ?? "").toLowerCase();

  if (value === "alta") return "lm-badge-success";
  if (value === "media" || value === "média") return "lm-badge-warning";
  return "lm-badge-danger";
}

function formatDate(value?: string | null) {
  if (!value) return "Sem data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem data";
  return date.toLocaleString("pt-BR");
}

function normalizeRow(row: any): CatalogRow {
  return {
    productName:
      row?.productName ??
      row?.product_name ??
      row?.name ??
      row?.raw_name ??
      "Produto sem nome",
    supplierCost: toNumber(
      row?.supplierCost ?? row?.supplier_cost ?? row?.cost ?? 0
    ),
    avgMlPrice: toNumber(
      row?.avgMlPrice ?? row?.avg_ml_price ?? row?.ml_price_avg ?? 0
    ),
    estimatedMargin: toNumber(
      row?.estimatedMargin ?? row?.estimated_margin ?? 0
    ),
    demandScore: toNumber(row?.demandScore ?? row?.demand_score ?? 0),
    competitionScore: toNumber(
      row?.competitionScore ?? row?.competition_score ?? 0
    ),
    opportunityScore: toNumber(
      row?.opportunityScore ?? row?.opportunity_score ?? 0
    ),
    riskLevel: row?.riskLevel ?? row?.risk_level ?? "medium",
    aiSummary: row?.aiSummary ?? row?.ai_summary ?? "",
  };
}

function normalizeSummary(summary: any): CatalogSummary {
  return {
    totalRows: toNumber(summary?.totalRows ?? summary?.total_rows ?? 0),
    parsedRows: toNumber(summary?.parsedRows ?? summary?.parsed_rows ?? 0),
    promisingCount: toNumber(
      summary?.promisingCount ?? summary?.promising_count ?? 0
    ),
    reviewCount: toNumber(summary?.reviewCount ?? summary?.review_count ?? 0),
    riskyCount: toNumber(summary?.riskyCount ?? summary?.risky_count ?? 0),
    avgMargin: toNumber(summary?.avgMargin ?? summary?.avg_margin ?? 0),
    avgOpportunity: toNumber(
      summary?.avgOpportunity ?? summary?.avg_opportunity ?? 0
    ),
    extractionQuality:
      summary?.extractionQuality ?? summary?.extraction_quality ?? "baixa",
    extractedTextPreview:
      summary?.extractedTextPreview ?? summary?.extracted_text_preview ?? "",
    highlights: Array.isArray(summary?.highlights) ? summary.highlights : [],
  };
}

function normalizeResult(input: any): CatalogAnalysisResult | null {
  if (!input || typeof input !== "object") return null;

  return {
    fileName:
      input?.fileName ??
      input?.file_name ??
      input?.title ??
      "Catálogo analisado",
    mode: input?.mode ?? "manual_review",
    summary: normalizeSummary(input?.summary ?? EMPTY_SUMMARY),
    rows: Array.isArray(input?.rows) ? input.rows.map(normalizeRow) : [],
  };
}

export default function CatalogoAnalyzerClient({
  initialResult,
  savedCatalogs = [],
}: Props) {
  const [result, setResult] = useState<CatalogAnalysisResult | null>(
    normalizeResult(initialResult)
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summary = result?.summary ?? EMPTY_SUMMARY;
  const rows = result?.rows ?? [];

  const grouped = useMemo(() => {
    const normalizedRows = rows.map((row) => {
      const supplierCost = toNumber(row.supplierCost);
      const avgMlPrice = toNumber(row.avgMlPrice);
      const estimatedMargin = toNumber(row.estimatedMargin);
      const opportunityScore = toNumber(row.opportunityScore);
      const demandScore = toNumber(row.demandScore);
      const competitionScore = toNumber(row.competitionScore);
      const risk = (row.riskLevel ?? "").toLowerCase();
      const semPrecoMl = avgMlPrice <= 0;
      const lucroEstimado = avgMlPrice - supplierCost;

      return {
        ...row,
        supplierCost,
        avgMlPrice,
        estimatedMargin,
        opportunityScore,
        demandScore,
        competitionScore,
        semPrecoMl,
        lucroEstimado,
        normalizedRisk:
          risk === "low" || risk === "baixo"
            ? "low"
            : risk === "high" || risk === "alto"
            ? "high"
            : "medium",
      };
    });

    const oportunidades = normalizedRows
      .filter((row) => row.normalizedRisk === "low")
      .sort((a, b) => b.opportunityScore - a.opportunityScore);

    const revisar = normalizedRows
      .filter((row) => row.normalizedRisk === "medium")
      .sort((a, b) => b.opportunityScore - a.opportunityScore);

    const evitar = normalizedRows
      .filter((row) => row.normalizedRisk === "high")
      .sort((a, b) => a.opportunityScore - b.opportunityScore);

    return { oportunidades, revisar, evitar, normalizedRows };
  }, [rows]);

  const stats = useMemo(() => {
    if (!result) return [];

    return [
      { label: "Produtos", value: String(summary.parsedRows) },
      { label: "Oportunidades", value: String(grouped.oportunidades.length) },
      { label: "Revisar", value: String(grouped.revisar.length) },
      { label: "Evitar", value: String(grouped.evitar.length) },
    ];
  }, [grouped.evitar.length, grouped.oportunidades.length, grouped.revisar.length, result, summary.parsedRows]);

  async function onFileChange(file?: File | null) {
    if (!file) {
      setError("Selecione um arquivo para analisar.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/catalogos/analisar", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => null);

      if (response.status === 401) {
        window.location.href = "/auth/login?next=/dashboard/produtos/catalogos";
        return;
      }

      if (response.status === 403) {
        window.location.href = "/checkout?plan=plus";
        return;
      }

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            payload?.message ||
            "Não foi possível analisar o catálogo."
        );
      }

      const normalized = normalizeResult(payload?.result ?? payload);

      if (!normalized) {
        throw new Error("A resposta da análise veio em formato inválido.");
      }

      setResult(normalized);
    } catch (err: any) {
      setError(err?.message ?? "Erro ao analisar catálogo.");
      setResult(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="lm-catalog">
      <section className="lm-card">
        <div className="lm-card-head">
          <div>
            <h3>Enviar catálogo</h3>
            <p>PDF, TXT ou CSV para leitura automática e priorização.</p>
          </div>

          <span className="lm-badge">PLUS</span>
        </div>

        <div className="catalog-upload-box">
          <input
            type="file"
            accept=".pdf,.txt,.csv"
            onChange={(e) => onFileChange(e.target.files?.[0])}
            className="lm-input"
          />
        </div>

        {uploading ? (
          <div className="lm-alert info">Analisando catálogo...</div>
        ) : null}

        {error ? <div className="lm-alert danger">{error}</div> : null}
      </section>

      {result ? (
        <>
          <section className="lm-decision">
            <div className="lm-decision-card success">
              <strong>{grouped.oportunidades.length}</strong>
              <span>Oportunidades</span>
            </div>

            <div className="lm-decision-card warning">
              <strong>{grouped.revisar.length}</strong>
              <span>Revisar</span>
            </div>

            <div className="lm-decision-card danger">
              <strong>{grouped.evitar.length}</strong>
              <span>Evitar</span>
            </div>
          </section>

          <section className="lm-card">
            <div className="lm-section-head">
              <div>
                <h2>Resumo da leitura</h2>
                <p className="lm-section-subtitle">{result.fileName}</p>
              </div>

              <span className={qualityClass(summary.extractionQuality)}>
                Leitura {qualityLabel(summary.extractionQuality)}
              </span>
            </div>

            {summary.extractionQuality.toLowerCase() === "baixa" ? (
              <div className="lm-inline-alert warning">
                Leitura fraca. Revise o arquivo antes de decidir compra.
              </div>
            ) : null}

            <div className="catalog-grid-4">
              {stats.map((item) => (
                <div key={item.label} className="catalog-stat">
                  <p className="catalog-stat-label">{item.label}</p>
                  <p className="catalog-stat-value">{item.value}</p>
                </div>
              ))}
            </div>

            {summary.highlights.length ? (
              <div className="lm-section">
                <div className="lm-section-head">
                  <div>
                    <h2>Destaques</h2>
                    <p className="lm-section-subtitle">
                      Pontos que merecem atenção imediata.
                    </p>
                  </div>
                </div>

                <div className="lm-grid">
                  {summary.highlights.map((highlight, index) => (
                    <div key={`${highlight}-${index}`} className="lm-product-card">
                      <p className="lm-product-summary">{highlight}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {!!grouped.oportunidades.length && (
            <section className="lm-section">
              <div className="lm-section-head">
                <div>
                  <h2>Foque nesses primeiro</h2>
                  <p className="lm-section-subtitle">
                    Prioridade inicial para validar preço, giro e concorrência.
                  </p>
                </div>

                <Link
                  href="/dashboard/operacao/simulador"
                  className="btn btn-primary"
                >
                  Simular compra
                </Link>
              </div>

              <div className="lm-grid">
                {grouped.oportunidades.slice(0, 6).map((row, index) => (
                  <div
                    key={`${row.productName}-${index}`}
                    className={`lm-product-card ${index < 3 ? "top" : ""}`}
                  >
                    <div className="lm-product-top">
                      <div>
                        <span className="lm-product-rank">
                          {index === 0
                            ? "Top 1"
                            : index === 1
                            ? "Top 2"
                            : index === 2
                            ? "Top 3"
                            : "Oportunidade"}
                        </span>
                        <h3>{row.productName}</h3>
                      </div>

                      <span className="lm-score-badge">
                        Score {row.opportunityScore}
                      </span>
                    </div>

                    <div className="lm-product-metrics">
                      <div>
                        <span>Custo</span>
                        <strong>{brl(row.supplierCost)}</strong>
                      </div>

                      <div>
                        <span>Preço ML</span>
                        <strong>
                          {row.semPrecoMl ? "Não validado" : brl(row.avgMlPrice)}
                        </strong>
                      </div>

                      <div>
                        <span>Margem</span>
                        <strong>{row.estimatedMargin.toFixed(1)}%</strong>
                      </div>

                      <div>
                        <span>Lucro</span>
                        <strong>{brl(row.lucroEstimado)}</strong>
                      </div>
                    </div>

                    {row.semPrecoMl ? (
                      <div className="lm-inline-alert warning">
                        Sem preço validado no Mercado Livre. Revise antes de
                        comprar.
                      </div>
                    ) : null}

                    <p className="lm-product-summary">
                      {row.aiSummary ||
                        "Vale validar concorrência, giro e posição de preço."}
                    </p>

                    <div className="lm-product-actions">
                      <button type="button" className="btn btn-secondary">
                        Ver detalhe
                      </button>
                      <Link
                        href="/dashboard/operacao/simulador"
                        className="btn btn-primary"
                      >
                        Simular
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!!grouped.revisar.length && (
            <section className="lm-section">
              <div className="lm-section-head">
                <div>
                  <h2>Revisar com cuidado</h2>
                  <p className="lm-section-subtitle">
                    Itens com sinal misto. Não descarta, mas não entra no topo.
                  </p>
                </div>
              </div>

              <div className="lm-grid">
                {grouped.revisar.slice(0, 6).map((row, index) => (
                  <div
                    key={`${row.productName}-${index}`}
                    className="lm-product-card warn"
                  >
                    <div className="lm-product-top">
                      <div>
                        <span className="lm-product-rank neutral">Revisar</span>
                        <h3>{row.productName}</h3>
                      </div>

                      <span className="lm-score-badge warn">
                        Score {row.opportunityScore}
                      </span>
                    </div>

                    <div className="lm-product-metrics">
                      <div>
                        <span>Custo</span>
                        <strong>{brl(row.supplierCost)}</strong>
                      </div>

                      <div>
                        <span>Margem</span>
                        <strong>{row.estimatedMargin.toFixed(1)}%</strong>
                      </div>
                    </div>

                    <p className="lm-product-summary">
                      {row.aiSummary ||
                        "Validar preço, concorrência e giro antes de avançar."}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!!grouped.evitar.length && (
            <section className="lm-section">
              <div className="lm-section-head">
                <div>
                  <h2>Evitar agora</h2>
                  <p className="lm-section-subtitle">
                    Produtos com risco alto ou margem ruim no cenário atual.
                  </p>
                </div>
              </div>

              <div className="lm-grid">
                {grouped.evitar.slice(0, 6).map((row, index) => (
                  <div
                    key={`${row.productName}-${index}`}
                    className="lm-product-card danger"
                  >
                    <div className="lm-product-top">
                      <div>
                        <span className="lm-product-rank danger">Evitar</span>
                        <h3>{row.productName}</h3>
                      </div>

                      <span className="lm-score-badge danger">
                        Score {row.opportunityScore}
                      </span>
                    </div>

                    <div className="lm-product-metrics">
                      <div>
                        <span>Custo</span>
                        <strong>{brl(row.supplierCost)}</strong>
                      </div>

                      <div>
                        <span>Margem</span>
                        <strong>{row.estimatedMargin.toFixed(1)}%</strong>
                      </div>
                    </div>

                    <p className="lm-product-summary">
                      {row.aiSummary ||
                        "Margem apertada ou risco alto para esse momento."}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="lm-section">
            <div className="lm-section-head">
              <div>
                <h2>Visão completa</h2>
                <p className="lm-section-subtitle">
                  Conferência final com custo, preço, margem e risco.
                </p>
              </div>
            </div>

            {!grouped.normalizedRows.length ? (
              <div className="catalog-empty">Nenhum produto encontrado.</div>
            ) : (
              <div className="catalog-table-wrap">
                <table className="lm-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Custo</th>
                      <th>Preço ML</th>
                      <th>Margem</th>
                      <th>Demanda</th>
                      <th>Concorrência</th>
                      <th>Score</th>
                      <th>Risco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped.normalizedRows.map((row, index) => (
                      <tr key={`${row.productName}-${index}`}>
                        <td>
                          <div>
                            <p className="catalog-product-name">
                              {row.productName}
                            </p>
                            {row.aiSummary ? (
                              <p className="catalog-product-sub">
                                {row.aiSummary}
                              </p>
                            ) : null}
                          </div>
                        </td>
                        <td>{brl(row.supplierCost)}</td>
                        <td>
                          {row.semPrecoMl ? "Não validado" : brl(row.avgMlPrice)}
                        </td>
                        <td>{row.estimatedMargin.toFixed(1)}%</td>
                        <td>{row.demandScore}</td>
                        <td>{row.competitionScore}</td>
                        <td>
                          <strong>{row.opportunityScore}</strong>
                        </td>
                        <td>
                          <span className={riskClass(row.riskLevel)}>
                            {riskLabel(row.riskLevel)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="lm-card">
            <div className="lm-section-head">
              <div>
                <h2>Prévia do texto</h2>
                <p className="lm-section-subtitle">
                  Texto extraído do arquivo para conferência rápida.
                </p>
              </div>
            </div>

            <pre className="catalog-preview">
              {summary.extractedTextPreview ||
                "Nenhum texto legível foi extraído."}
            </pre>
          </section>
        </>
      ) : null}

      <section className="lm-section">
        <div className="lm-section-head">
          <div>
            <h2>Histórico</h2>
            <p className="lm-section-subtitle">
              Catálogos já processados para consulta posterior.
            </p>
          </div>
        </div>

        {!savedCatalogs.length ? (
          <div className="catalog-empty">Nenhum catálogo salvo.</div>
        ) : (
          <div className="catalog-history-grid">
            {savedCatalogs.map((catalog) => (
              <Link
                key={catalog.id}
                href={`/dashboard/produtos/catalogos/${catalog.id}`}
                className="catalog-history-card"
              >
                <div className="catalog-history-top">
                  <div>
                    <p className="catalog-product-name">{catalog.title}</p>
                    <p className="catalog-product-sub">
                      {catalog.file_name || "Sem arquivo"}
                    </p>
                  </div>

                  <span className="small">{formatDate(catalog.created_at)}</span>
                </div>

                <div className="catalog-history-meta">
                  <span className="pill">{catalog.status || "desconhecido"}</span>
                  <span className="pill">
                    {catalog.items_count ?? 0} produtos
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}