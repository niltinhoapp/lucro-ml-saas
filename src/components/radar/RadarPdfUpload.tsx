"use client";

import { useState } from "react";

type EnrichedPdfProduct = {
  title: string;
  estimatedCost: number | null;
  possibleSku: string | null;
  categoryHint: string | null;
  opportunityLevel: "baixa" | "media" | "alta";
  notes: string[];

  mlAveragePrice: number | null;
  mlDemandScore: number;
  mlCompetitionScore: number;
  marginPercent: number | null;
  finalScore: number;
  risk: "baixo" | "moderado" | "alto";
  mlSampleSize: number;
  mlTopTitles: string[];
};

type PdfAiMlResponse = {
  ok: boolean;
  source: "pdf_catalog_ai_ml";
  fileName: string;
  readingQuality: "baixa" | "media" | "alta";
  summary: string;
  itemsFound: number;
  products: EnrichedPdfProduct[];
  error?: string;
  details?: string;
};

function brl(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function percent(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(1)}%`;
}

function qualityBadge(level: "baixa" | "media" | "alta") {
  switch (level) {
    case "alta":
      return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30";
    case "media":
      return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30";
    case "baixa":
      return "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30";
    default:
      return "bg-white/10 text-white ring-1 ring-white/10";
  }
}

function riskBadge(risk: "baixo" | "moderado" | "alto") {
  switch (risk) {
    case "baixo":
      return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30";
    case "moderado":
      return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30";
    case "alto":
      return "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30";
    default:
      return "bg-white/10 text-white ring-1 ring-white/10";
  }
}

function scoreBarClass(score: number) {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 45) return "bg-amber-500";
  return "bg-rose-500";
}

function demandLabel(score: number) {
  if (score >= 75) return "alta";
  if (score >= 45) return "média";
  return "baixa";
}

function competitionLabel(score: number) {
  if (score >= 70) return "baixa";
  if (score >= 40) return "média";
  return "alta";
}

export default function RadarPdfUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PdfAiMlResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      setError("Selecione um PDF para analisar.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setData(null);

      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/radar/pdf", {
        method: "POST",
        body: form,
      });

      const json = (await res.json()) as PdfAiMlResponse;

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Falha ao analisar o PDF.");
      }

      setData(json);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro inesperado no upload.";
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="p-5 border shadow-2xl rounded-3xl border-white/10 bg-zinc-950">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white">
            Analisar catálogo em PDF com IA
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            A IA lê o catálogo, extrai os produtos e cruza com o Mercado Livre
            para estimar preço, margem e potencial de revenda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="flex-1 block h-12 px-4 py-3 text-sm text-white border rounded-2xl border-white/10 bg-zinc-900 file:mr-4 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-zinc-950"
          />

          <button
            type="submit"
            disabled={loading}
            className="h-12 px-5 text-sm font-semibold transition bg-white rounded-2xl text-zinc-950 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Analisando..." : "Ler PDF com IA"}
          </button>
        </form>

        {error ? (
          <div className="px-4 py-3 mt-4 text-sm border rounded-2xl border-rose-500/30 bg-rose-500/10 text-rose-200">
            {error}
          </div>
        ) : null}
      </div>

      {data ? (
        <>
          <div className="p-5 border shadow-2xl rounded-3xl border-white/10 bg-zinc-950">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Resumo da IA
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  {data.fileName}
                </h3>
                <p className="mt-3 text-sm text-zinc-300">{data.summary}</p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${qualityBadge(
                  data.readingQuality
                )}`}
              >
                leitura {data.readingQuality}
              </span>
            </div>

            <div className="grid gap-3 mt-4 md:grid-cols-4">
              <div className="p-4 border rounded-2xl border-white/10 bg-zinc-900">
                <p className="text-xs text-zinc-500">Produtos encontrados</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {data.itemsFound}
                </p>
              </div>

              <div className="p-4 border rounded-2xl border-white/10 bg-zinc-900">
                <p className="text-xs text-zinc-500">Leitura</p>
                <p className="mt-1 text-lg font-semibold text-white capitalize">
                  {data.readingQuality}
                </p>
              </div>

              <div className="p-4 border rounded-2xl border-white/10 bg-zinc-900">
                <p className="text-xs text-zinc-500">Com preço ML</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {
                    data.products.filter((item) => item.mlAveragePrice !== null)
                      .length
                  }
                </p>
              </div>

              <div className="p-4 border rounded-2xl border-white/10 bg-zinc-900">
                <p className="text-xs text-zinc-500">Bom score (70+)</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {data.products.filter((item) => item.finalScore >= 70).length}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Produtos identificados
              </h3>
              <p className="mt-1 text-sm text-zinc-400">
                Itens lidos pela IA e enriquecidos com sinais do Mercado Livre.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {data.products.map((item, index) => (
                <article
                  key={`${item.title}-${index}`}
                  className="p-5 border shadow-xl rounded-3xl border-white/10 bg-zinc-950"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-sm text-zinc-400">
                        Categoria: {item.categoryHint || "—"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${riskBadge(
                        item.risk
                      )}`}
                    >
                      {item.risk}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 md:grid-cols-4">
                    <div className="p-3 border rounded-2xl border-white/10 bg-zinc-900">
                      <p className="text-[11px] text-zinc-500">Custo</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {brl(item.estimatedCost)}
                      </p>
                    </div>

                    <div className="p-3 border rounded-2xl border-white/10 bg-zinc-900">
                      <p className="text-[11px] text-zinc-500">Preço ML</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {brl(item.mlAveragePrice)}
                      </p>
                    </div>

                    <div className="p-3 border rounded-2xl border-white/10 bg-zinc-900">
                      <p className="text-[11px] text-zinc-500">Margem</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {percent(item.marginPercent)}
                      </p>
                    </div>

                    <div className="p-3 border rounded-2xl border-white/10 bg-zinc-900">
                      <p className="text-[11px] text-zinc-500">SKU/Ref</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {item.possibleSku || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 md:grid-cols-4">
                    <div className="p-3 border rounded-2xl border-white/10 bg-zinc-900">
                      <p className="text-[11px] text-zinc-500">Demanda</p>
                      <p className="mt-1 text-sm font-semibold text-white capitalize">
                        {demandLabel(item.mlDemandScore)} ({item.mlDemandScore})
                      </p>
                    </div>

                    <div className="p-3 border rounded-2xl border-white/10 bg-zinc-900">
                      <p className="text-[11px] text-zinc-500">Concorrência</p>
                      <p className="mt-1 text-sm font-semibold text-white capitalize">
                        {competitionLabel(item.mlCompetitionScore)} ({item.mlCompetitionScore})
                      </p>
                    </div>

                    <div className="p-3 border rounded-2xl border-white/10 bg-zinc-900">
                      <p className="text-[11px] text-zinc-500">Pontuação</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {item.finalScore}
                      </p>
                    </div>

                    <div className="p-3 border rounded-2xl border-white/10 bg-zinc-900">
                      <p className="text-[11px] text-zinc-500">Amostra ML</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {item.mlSampleSize}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-zinc-400">Score final</p>
                      <p className="text-sm font-semibold text-white">
                        {item.finalScore}/100
                      </p>
                    </div>

                    <div className="w-full h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full ${scoreBarClass(item.finalScore)}`}
                        style={{ width: `${item.finalScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 mt-4 border rounded-2xl border-white/10 bg-zinc-900">
                    <p className="text-sm font-semibold text-white">
                      Observações da IA
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                      {item.notes?.length ? (
                        item.notes.map((note, idx) => <li key={idx}>• {note}</li>)
                      ) : (
                        <li>• Sem observações extras.</li>
                      )}
                    </ul>
                  </div>

                  {item.mlTopTitles?.length ? (
                    <div className="p-4 mt-4 border rounded-2xl border-white/10 bg-zinc-900">
                      <p className="text-sm font-semibold text-white">
                        Referências encontradas no ML
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                        {item.mlTopTitles.map((title, idx) => (
                          <li key={`${title}-${idx}`}>• {title}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}