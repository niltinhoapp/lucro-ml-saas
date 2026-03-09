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
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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
    riskLevel: row?.riskLevel ?? row?.risk_level ?? "moderado",
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

function normalizeCatalogResult(input: any): CatalogAnalysisResult | null {
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

function riskLabel(risk?: string) {
  const value = (risk ?? "").toLowerCase();
  if (value === "baixo" || value === "low") return "Baixo";
  if (value === "alto" || value === "high") return "Alto";
  return "Moderado";
}

function riskClassName(risk?: string) {
  const value = (risk ?? "").toLowerCase();
  if (value === "baixo" || value === "low") return "catalog-risk-low";
  if (value === "alto" || value === "high") return "catalog-risk-high";
  return "catalog-risk-medium";
}

function qualityBadgeClass(quality?: string) {
  const q = (quality ?? "").toLowerCase();
  if (q === "alta") return "catalog-risk-low";
  if (q === "media" || q === "média") return "catalog-risk-medium";
  return "catalog-risk-high";
}

function formatDate(value?: string | null) {
  if (!value) return "Sem data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem data";
  return date.toLocaleString("pt-BR");
}

export default function CatalogoAnalyzerClient({
  initialResult,
  savedCatalogs = [],
}: Props) {
  const [result, setResult] = useState<CatalogAnalysisResult | null>(
    normalizeCatalogResult(initialResult)
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCatalogId, setSavedCatalogId] = useState<string | null>(null);

  const summary = result?.summary ?? EMPTY_SUMMARY;
  const rows = result?.rows ?? [];

  const stats = useMemo(() => {
    if (!result) return null;

    return [
      { label: "Itens lidos", value: String(summary.parsedRows) },
      { label: "Promissores", value: String(summary.promisingCount) },
      { label: "Em revisão", value: String(summary.reviewCount) },
      { label: "Margem média", value: `${summary.avgMargin.toFixed(1)}%` },
    ];
  }, [result, summary]);

  async function onFileChange(file?: File | null) {
    if (!file) {
      setError("Envie um arquivo para continuar.");
      return;
    }

    setUploading(true);
    setError(null);
    setSavedCatalogId(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/catalogos/analisar", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => null);
      console.log("[frontend] payload /api/catalogos/analisar:", payload);

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            payload?.message ||
            "Não foi possível analisar o catálogo."
        );
      }

      if (payload?.warning) {
        console.warn("[frontend] warning da API:", payload.warning);
      }

      const normalized = normalizeCatalogResult(payload?.result ?? payload);
      if (!normalized) {
        throw new Error("A análise retornou em formato inválido.");
      }

      setResult(normalized);
      setSavedCatalogId(payload?.savedCatalogId ?? null);
    } catch (err: any) {
      console.error("Erro ao analisar catálogo:", err);
      setError(err?.message || "Erro ao analisar catálogo.");
      setResult(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="catalog-shell">
      <section className="space-y-6 catalog-hero">
        <div className="space-y-3">
          <span className="badge-premium">PLUS • Inteligência de Catálogo</span>
          <h2 className="catalog-hero-title">
            Análise de catálogo do fornecedor
          </h2>
          <p className="catalog-hero-subtitle">
            Envie o catálogo e transforme PDF em uma leitura prática para decidir
            compra, margem e prioridade.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="catalog-card">
            <p className="catalog-card-title">PDF → tabela</p>
            <p className="catalog-card-desc">
              Estrutura os itens para seguir o fluxo do projeto.
            </p>
          </div>

          <div className="catalog-card">
            <p className="catalog-card-title">Leitura por item</p>
            <p className="catalog-card-desc">
              Calcula margem, score e risco com base no padrão atual.
            </p>
          </div>

          <div className="catalog-card">
            <p className="catalog-card-title">Compatível com fluxo atual</p>
            <p className="catalog-card-desc">
              Mantém visual, lógica e integração com o restante do sistema.
            </p>
          </div>
        </div>

        <div className="space-y-4 catalog-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="catalog-card-title">Enviar catálogo</p>
              <p className="catalog-card-desc">
                PDFs baseados em texto funcionam melhor nesta fase. TXT e CSV
                também podem ser enviados.
              </p>
            </div>

            <span className="badge-premium">Plano atual: PLUS</span>
          </div>

          <div className="space-y-3 catalog-upload-box">
            <input
              type="file"
              accept=".pdf,.txt,.csv"
              onChange={(e) => onFileChange(e.target.files?.[0])}
              className="block w-full px-4 py-3 text-sm border rounded-xl border-white/10 bg-white/5 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm"
            />

            {uploading && (
              <div className="px-4 py-3 text-sm border rounded-xl border-blue-500/30 bg-blue-500/10">
                Analisando catálogo...
              </div>
            )}

            {error && (
              <div className="px-4 py-3 text-sm border rounded-xl border-red-500/30 bg-red-500/10">
                {error}
              </div>
            )}

            {savedCatalogId && (
              <div className="px-4 py-3 text-sm border rounded-xl border-emerald-500/30 bg-emerald-500/10">
                Catálogo salvo com sucesso no histórico.{" "}
                <Link
                  href={`/dashboard/catalogos/${savedCatalogId}`}
                  className="underline underline-offset-4"
                >
                  Abrir análise salva
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {stats && (
        <section className="catalog-grid-4">
          {stats.map((item) => (
            <div key={item.label} className="catalog-stat">
              <p className="catalog-stat-label">{item.label}</p>
              <p className="catalog-stat-value">{item.value}</p>
            </div>
          ))}
        </section>
      )}

      {result && (
        <>
          <section className="space-y-5 catalog-card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <h3 className="catalog-card-title">Leitura do catálogo</h3>
                <p className="catalog-card-desc">
                  Arquivo: {result.fileName}
                </p>
              </div>

              <span
                className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${qualityBadgeClass(
                  summary.extractionQuality
                )}`}
              >
                Qualidade da extração: {summary.extractionQuality}
              </span>
            </div>

            {summary.extractionQuality === "baixa" && (
              <div className="px-4 py-3 text-sm border rounded-xl border-amber-500/30 bg-amber-500/10 text-amber-100">
                Extração fraca. O catálogo precisa de revisão manual. PDFs com
                imagem ou layout muito fechado podem exigir OCR ou ajuste posterior.
              </div>
            )}

            {summary.highlights.length > 0 && (
              <div className="space-y-3">
                <p className="catalog-card-title">Destaques</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {summary.highlights.map((highlight, index) => (
                    <div
                      key={`${highlight}-${index}`}
                      className="px-4 py-4 text-sm border rounded-2xl border-white/10 bg-white/5 text-zinc-200"
                    >
                      {highlight}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4 catalog-card">
            <div className="space-y-2">
              <h3 className="catalog-card-title">Tabela priorizada</h3>
              <p className="catalog-card-desc">
                Itens já organizados no mesmo padrão do projeto, com margem,
                risco e score de oportunidade.
              </p>
            </div>

            {rows.length === 0 ? (
              <div className="catalog-empty">
                Nenhum item estruturado foi encontrado neste catálogo. Tente
                outro arquivo ou revise o PDF.
              </div>
            ) : (
              <div className="catalog-table-wrap">
                <table className="catalog-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Custo</th>
                      <th>Preço médio ML</th>
                      <th>Margem</th>
                      <th>Demanda</th>
                      <th>Concorrência</th>
                      <th>Score</th>
                      <th>Risco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
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
                        <td>R$ {toNumber(row.supplierCost).toFixed(2)}</td>
                        <td>R$ {toNumber(row.avgMlPrice).toFixed(2)}</td>
                        <td>{toNumber(row.estimatedMargin).toFixed(1)}%</td>
                        <td>{toNumber(row.demandScore)}</td>
                        <td>{toNumber(row.competitionScore)}</td>
                        <td>
                          <strong>{toNumber(row.opportunityScore)}</strong>
                        </td>
                        <td>
                          <span
                            className={riskClassName(row.riskLevel)}
                          >
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

          <section className="space-y-4 catalog-card">
            <div className="space-y-2">
              <h3 className="catalog-card-title">Prévia do texto extraído</h3>
              <p className="catalog-card-desc">
                Útil para revisar PDFs mais bagunçados sem sair do padrão do
                projeto.
              </p>
            </div>

            <pre className="catalog-preview">
              {summary.extractedTextPreview ||
                "Nenhum texto legível foi extraído deste arquivo."}
            </pre>
          </section>
        </>
      )}

      <section className="space-y-4 catalog-card">
        <div className="space-y-2">
          <h3 className="catalog-card-title">Histórico de catálogos</h3>
          <p className="catalog-card-desc">
            Cada leitura fica conectada ao banco e pronta para ser revisitada sem
            precisar reenviar o arquivo.
          </p>
        </div>

        {savedCatalogs.length === 0 ? (
          <div className="catalog-empty">
            Nenhum catálogo salvo ainda. Envie o primeiro PDF para montar
            histórico e reaproveitar suas análises dentro do PLUS.
          </div>
        ) : (
          <div className="space-y-3">
            {savedCatalogs.map((catalog) => (
              <Link
                key={catalog.id}
                href={`/dashboard/catalogos/${catalog.id}`}
                className="catalog-history-item"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-white">{catalog.title}</p>
                    <p className="text-sm text-zinc-400">
                      {catalog.file_name || "Sem arquivo"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                    <span>Status: {catalog.status || "desconhecido"}</span>
                    <span>Itens: {catalog.items_count ?? 0}</span>
                    <span>{formatDate(catalog.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}