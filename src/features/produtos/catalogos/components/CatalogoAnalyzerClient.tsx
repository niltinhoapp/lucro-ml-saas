"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

/* =========================
   TYPES (mantidos)
========================= */

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

/* =========================
   HELPERS
========================= */

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function brl(v: number) {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function riskLabel(risk?: string) {
  const v = (risk ?? "").toLowerCase();
  if (v === "baixo" || v === "low") return "Baixo";
  if (v === "alto" || v === "high") return "Alto";
  return "Moderado";
}

function riskClass(risk?: string) {
  const v = (risk ?? "").toLowerCase();
  if (v === "baixo" || v === "low") return "lm-badge-success";
  if (v === "alto" || v === "high") return "lm-badge-danger";
  return "lm-badge-warning";
}

/* =========================
   COMPONENT
========================= */

export default function CatalogoAnalyzerClient({
  initialResult,
  savedCatalogs = [],
}: Props) {
  const [result, setResult] = useState<CatalogAnalysisResult | null>(
    initialResult as any
  );

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = result?.rows ?? [];
  const summary = result?.summary;

  /* =========================
     🔥 CORE: CLASSIFICAÇÃO
  ========================= */

  const grouped = useMemo(() => {
    const oportunidades = rows.filter(
      (r) => (r.riskLevel ?? "").toLowerCase() === "low"
    );

    const revisar = rows.filter(
      (r) => (r.riskLevel ?? "").toLowerCase() === "medium"
    );

    const evitar = rows.filter(
      (r) => (r.riskLevel ?? "").toLowerCase() === "high"
    );

    return { oportunidades, revisar, evitar };
  }, [rows]);

  /* =========================
     UPLOAD
  ========================= */

  async function onFileChange(file?: File | null) {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/catalogos/analisar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.message);

      setResult(data?.result ?? data);
    } catch (err: any) {
      setError(err?.message ?? "Erro ao analisar");
    } finally {
      setUploading(false);
    }
  }

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="lm-catalog">

      {/* =========================
         UPLOAD
      ========================= */}
      <section className="lm-card">
        <div className="lm-card-head">
          <div>
            <h3>Enviar catálogo</h3>
            <p>PDF, TXT ou CSV para análise automática</p>
          </div>

          <span className="lm-badge">PLUS</span>
        </div>

        <input
          type="file"
          onChange={(e) => onFileChange(e.target.files?.[0])}
          className="lm-input"
        />

        {uploading && (
          <div className="lm-alert info">
            Analisando catálogo...
          </div>
        )}

        {error && (
          <div className="lm-alert danger">{error}</div>
        )}
      </section>

      {/* =========================
         DECISÃO (🔥 PRINCIPAL)
      ========================= */}

      {result && (
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
      )}

      {/* =========================
         OPORTUNIDADES
      ========================= */}

      {!!grouped.oportunidades.length && (
        <section className="lm-section">
          <h2>Foque nesses primeiro</h2>

          <div className="lm-grid">
            {grouped.oportunidades.slice(0, 6).map((row, i) => (
              <div key={i} className="lm-product-card">
                <h3>{row.productName}</h3>

                <div className="lm-product-metrics">
                  <div>
                    <span>Lucro</span>
                    <strong>
                      {brl(toNumber(row.avgMlPrice) - toNumber(row.supplierCost))}
                    </strong>
                  </div>

                  <div>
                    <span>Margem</span>
                    <strong>{toNumber(row.estimatedMargin).toFixed(1)}%</strong>
                  </div>
                </div>

                <p className="lm-product-summary">
                  {row.aiSummary || "Validar concorrência"}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================
         REVISAR
      ========================= */}

      {!!grouped.revisar.length && (
        <section className="lm-section">
          <h2>Revisar com cuidado</h2>

          <div className="lm-grid">
            {grouped.revisar.map((row, i) => (
              <div key={i} className="lm-product-card warn">
                <h3>{row.productName}</h3>
                <p>Validar preço e concorrência.</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================
         EVITAR
      ========================= */}

      {!!grouped.evitar.length && (
        <section className="lm-section">
          <h2>Evitar agora</h2>

          <div className="lm-grid">
            {grouped.evitar.map((row, i) => (
              <div key={i} className="lm-product-card danger">
                <h3>{row.productName}</h3>
                <p>Margem ruim ou risco alto.</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================
         TABELA FINAL
      ========================= */}

      {!!rows.length && (
        <section className="lm-section">
          <h2>Visão completa</h2>

          <table className="lm-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Custo</th>
                <th>Preço ML</th>
                <th>Margem</th>
                <th>Score</th>
                <th>Risco</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td>{row.productName}</td>
                  <td>{brl(toNumber(row.supplierCost))}</td>
                  <td>{brl(toNumber(row.avgMlPrice))}</td>
                  <td>{toNumber(row.estimatedMargin).toFixed(1)}%</td>
                  <td>{toNumber(row.opportunityScore)}</td>
                  <td>
                    <span className={riskClass(row.riskLevel)}>
                      {riskLabel(row.riskLevel)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* =========================
         HISTÓRICO
      ========================= */}

      {!!savedCatalogs.length && (
        <section className="lm-section">
          <h2>Histórico</h2>

          <div className="lm-grid">
            {savedCatalogs.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/produtos/catalogos/${c.id}`}
                className="lm-product-card"
              >
                <h3>{c.title}</h3>
                <p>{c.items_count ?? 0} produtos</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}