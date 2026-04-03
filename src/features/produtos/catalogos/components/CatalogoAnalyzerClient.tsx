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

type RadarBadge =
  | "oportunidade_real"
  | "avaliar_com_cuidado"
  | "evitar";

type RadarItem = {
  nome: string;
  categoria?: string;
  custo: number;
  preco: number;
  score: number;
  margem: number;
  lucro: number;
  status: "excelente" | "atenção" | "risco";
  badge: RadarBadge;
  insights: string[];
  alertas: string[];
  recomendacoes: string[];
  meta: Record<string, any>;
};

type RadarResult = {
  ranking: RadarItem[];
  oportunidades: RadarItem[];
  atentos: RadarItem[];
  risco: RadarItem[];
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

function normalizeRadarItem(item: any): RadarItem {
  return {
    nome: item?.nome ?? "Produto",
    categoria: item?.categoria ?? "",
    custo: toNumber(item?.custo ?? 0),
    preco: toNumber(item?.preco ?? 0),
    score: toNumber(item?.score ?? 0),
    margem: toNumber(item?.margem ?? 0),
    lucro: toNumber(item?.lucro ?? 0),
    status: item?.status ?? "atenção",
    badge: item?.badge ?? "avaliar_com_cuidado",
    insights: Array.isArray(item?.insights) ? item.insights : [],
    alertas: Array.isArray(item?.alertas) ? item.alertas : [],
    recomendacoes: Array.isArray(item?.recomendacoes)
      ? item.recomendacoes
      : [],
    meta: item?.meta && typeof item.meta === "object" ? item.meta : {},
  };
}

function normalizeRadarResult(input: any): RadarResult | null {
  if (!input || typeof input !== "object") return null;

  return {
    ranking: Array.isArray(input?.ranking)
      ? input.ranking.map(normalizeRadarItem)
      : [],
    oportunidades: Array.isArray(input?.oportunidades)
      ? input.oportunidades.map(normalizeRadarItem)
      : [],
    atentos: Array.isArray(input?.atentos)
      ? input.atentos.map(normalizeRadarItem)
      : [],
    risco: Array.isArray(input?.risco)
      ? input.risco.map(normalizeRadarItem)
      : [],
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

function radarBadgeText(badge?: RadarBadge) {
  if (badge === "oportunidade_real") return "Oportunidade real";
  if (badge === "evitar") return "Evitar";
  return "Avaliar";
}

function radarBadgeClass(badge?: RadarBadge) {
  if (badge === "oportunidade_real") return "catalog-risk-low";
  if (badge === "evitar") return "catalog-risk-high";
  return "catalog-risk-medium";
}

export default function CatalogoAnalyzerClient({
  initialResult,
  savedCatalogs = [],
}: Props) {
  const [result, setResult] = useState<CatalogAnalysisResult | null>(
    normalizeCatalogResult(initialResult)
  );
  const [radar, setRadar] = useState<RadarResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCatalogId, setSavedCatalogId] = useState<string | null>(null);

  const summary = result?.summary ?? EMPTY_SUMMARY;
  const rows = result?.rows ?? [];

  const stats = useMemo(() => {
    if (!result) return null;

    return [
      { label: "Produtos", value: String(summary.parsedRows) },
      { label: "Oportunidades", value: String(summary.promisingCount) },
      { label: "Revisar", value: String(summary.reviewCount) },
      { label: "Margem média", value: `${summary.avgMargin.toFixed(1)}%` },
    ];
  }, [result, summary]);

  const radarStats = useMemo(() => {
    if (!radar) return null;

    return [
      { label: "Ranking", value: String(radar.ranking.length) },
      { label: "Oportunidades reais", value: String(radar.oportunidades.length) },
      { label: "Avaliar", value: String(radar.atentos.length) },
      { label: "Evitar", value: String(radar.risco.length) },
    ];
  }, [radar]);

  async function onFileChange(file?: File | null) {
    if (!file) {
      setError("Selecione um arquivo.");
      return;
    }

    setUploading(true);
    setError(null);
    setSavedCatalogId(null);
    setRadar(null);

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

      const normalized = normalizeCatalogResult(payload?.result ?? payload);
      const normalizedRadar = normalizeRadarResult(payload?.radar);

      if (!normalized) {
        throw new Error("A análise retornou em formato inválido.");
      }

      setResult(normalized);
      setRadar(normalizedRadar);
      setSavedCatalogId(payload?.savedCatalogId ?? null);
    } catch (err: any) {
      setError(err?.message || "Erro ao analisar catálogo.");
      setResult(null);
      setRadar(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="catalog-shell">
      <section className="catalog-card">
        <div className="catalog-drop-head">
          <div>
            <p className="catalog-card-title">Enviar catálogo</p>
            <p className="catalog-card-desc">
              PDF, TXT ou CSV para leitura e priorização
            </p>
          </div>

          <span className="badge pro">PLUS</span>
        </div>

        <div className="catalog-upload-box">
          <input
            type="file"
            accept=".pdf,.txt,.csv"
            onChange={(e) => onFileChange(e.target.files?.[0])}
            className="field"
          />

          {uploading && (
            <div className="alert info" style={{ marginTop: 12 }}>
              Analisando catálogo e montando Radar ML...
            </div>
          )}

          {error && (
            <div className="alert danger" style={{ marginTop: 12 }}>
              {error}
            </div>
          )}

          {savedCatalogId && (
            <div className="alert success" style={{ marginTop: 12 }}>
              Catálogo salvo.{" "}
              <Link href={`/dashboard/produtos/catalogos/${savedCatalogId}`}>
                Abrir análise
              </Link>
            </div>
          )}
        </div>
      </section>

      {radarStats && (
        <section className="catalog-grid-4">
          {radarStats.map((item) => (
            <div key={item.label} className="catalog-stat">
              <p className="catalog-stat-label">{item.label}</p>
              <p className="catalog-stat-value">{item.value}</p>
            </div>
          ))}
        </section>
      )}

      {radar?.oportunidades?.length ? (
        <section className="catalog-card">
          <div className="card-head">
            <div>
              <h3 className="catalog-card-title">Radar ML</h3>
              <p className="catalog-card-desc">
                Prioridade de leitura: o que merece atenção primeiro
              </p>
            </div>
          </div>

          <div className="catalog-highlights-grid" style={{ marginTop: 16 }}>
            {radar.oportunidades.slice(0, 6).map((item, index) => (
              <div
                key={`${item.nome}-${index}`}
                className="catalog-card"
                style={{ padding: 16 }}
              >
                <div className="card-head">
                  <div>
                    <p className="catalog-product-name">{item.nome}</p>
                    {item.categoria ? (
                      <p className="catalog-product-sub">{item.categoria}</p>
                    ) : null}
                  </div>

                  <span className={radarBadgeClass(item.badge)}>
                    {radarBadgeText(item.badge)}
                  </span>
                </div>

                <div className="catalog-grid-4" style={{ marginTop: 12 }}>
                  <div className="catalog-stat">
                    <p className="catalog-stat-label">Score</p>
                    <p className="catalog-stat-value">{item.score}</p>
                  </div>

                  <div className="catalog-stat">
                    <p className="catalog-stat-label">Margem</p>
                    <p className="catalog-stat-value">
                      {item.margem.toFixed(1)}%
                    </p>
                  </div>

                  <div className="catalog-stat">
                    <p className="catalog-stat-label">Lucro</p>
                    <p className="catalog-stat-value">
                      R$ {item.lucro.toFixed(2)}
                    </p>
                  </div>

                  <div className="catalog-stat">
                    <p className="catalog-stat-label">Preço</p>
                    <p className="catalog-stat-value">
                      R$ {item.preco.toFixed(2)}
                    </p>
                  </div>
                </div>

                {item.alertas?.length > 0 ? (
                  <div style={{ marginTop: 14 }}>
                    <div className="alert info">{item.alertas[0]}</div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {radar?.risco?.length ? (
        <section className="catalog-card">
          <div className="card-head">
            <div>
              <h3 className="catalog-card-title">Evitar agora</h3>
              <p className="catalog-card-desc">
                Produtos com score fraco para o cenário atual
              </p>
            </div>
          </div>

          <div className="catalog-highlights-grid" style={{ marginTop: 16 }}>
            {radar.risco.slice(0, 4).map((item, index) => (
              <div
                key={`${item.nome}-${index}`}
                className="catalog-card"
                style={{ padding: 16 }}
              >
                <div className="card-head">
                  <div>
                    <p className="catalog-product-name">{item.nome}</p>
                  </div>

                  <span className={radarBadgeClass(item.badge)}>
                    {radarBadgeText(item.badge)}
                  </span>
                </div>

                <div style={{ marginTop: 12 }}>
                  <p className="catalog-card-desc">Score: {item.score}</p>
                </div>

                {item.alertas?.length > 0 ? (
                  <div style={{ marginTop: 12 }}>
                    <div className="alert danger">{item.alertas[0]}</div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

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
          <section className="catalog-card">
            <div className="card-head">
              <div>
                <h3 className="catalog-card-title">Resumo da leitura</h3>
                <p className="catalog-card-desc">{result.fileName}</p>
              </div>

              <span className={qualityBadgeClass(summary.extractionQuality)}>
                Leitura: {summary.extractionQuality}
              </span>
            </div>

            {summary.extractionQuality === "baixa" && (
              <div className="alert info" style={{ marginTop: 14 }}>
                Leitura fraca. Revise o arquivo antes de decidir compra.
              </div>
            )}

            {summary.highlights.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <p className="catalog-card-title">Destaques</p>

                <div className="catalog-highlights-grid" style={{ marginTop: 12 }}>
                  {summary.highlights.map((highlight, index) => (
                    <div
                      key={`${highlight}-${index}`}
                      className="catalog-card"
                      style={{ padding: 16 }}
                    >
                      <p className="catalog-card-desc">{highlight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="catalog-card">
            <div className="card-head">
              <div>
                <h3 className="catalog-card-title">Produtos encontrados</h3>
                <p className="catalog-card-desc">
                  Visão detalhada para conferência final
                </p>
              </div>
            </div>

            {rows.length === 0 ? (
              <div className="catalog-empty" style={{ marginTop: 16 }}>
                Nenhum produto encontrado.
              </div>
            ) : (
              <div className="catalog-table-wrap" style={{ marginTop: 16 }}>
                <table className="catalog-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Custo</th>
                      <th>Preço ML</th>
                      <th>Margem</th>
                      <th>Demanda</th>
                      <th>Concorrência</th>
                      <th>Pontuação</th>
                      <th>Risco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={`${row.productName}-${index}`}>
                        <td>
                          <div>
                            <p className="catalog-product-name">{row.productName}</p>
                            {row.aiSummary ? (
                              <p className="catalog-product-sub">{row.aiSummary}</p>
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
                          <span className={riskClassName(row.riskLevel)}>
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

          <section className="catalog-card">
            <div>
              <h3 className="catalog-card-title">Prévia do texto</h3>
            </div>

            <pre className="catalog-preview" style={{ marginTop: 16 }}>
              {summary.extractedTextPreview ||
                "Nenhum texto legível foi extraído."}
            </pre>
          </section>
        </>
      )}

      <section className="catalog-card">
        <div>
          <h3 className="catalog-card-title">Histórico</h3>
        </div>

        {savedCatalogs.length === 0 ? (
          <div className="catalog-empty" style={{ marginTop: 16 }}>
            Nenhum catálogo salvo.
          </div>
        ) : (
          <div className="catalog-history-grid" style={{ marginTop: 16 }}>
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
                  <span className="pill">{catalog.items_count ?? 0} produtos</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}