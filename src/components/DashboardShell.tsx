"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import UploadPlanilha from "@/components/UploadPlanilha";
import type { UploadResult } from "@/components/UploadPlanilha";
import type { SimulacaoRow } from "@/types/simulacoes";

export default function DashboardShell({
  initialSimulacoes,
}: {
  initialSimulacoes: SimulacaoRow[];
}) {
  const router = useRouter();

  const [simulacoes, setSimulacoes] = useState<SimulacaoRow[]>(initialSimulacoes);
  const [last, setLast] = useState<UploadResult | null>(null);

  const top = useMemo(() => {
    const latest = simulacoes[0];
    return {
      total: simulacoes.length,
      lucro: latest?.lucro ?? 0,
      margem: latest?.margem ?? 0,
    };
  }, [simulacoes]);

  function calcularLucroFallback(dre: NonNullable<UploadResult["dre"]>) {
    const receita = Number(dre.receitaTotal || 0);
    const custos =
      Number(dre.custoProdutos || 0) +
      Number(dre.taxas || 0) +
      Number(dre.logistica || 0);
    return receita - custos;
  }

  function onUploadResult(result: UploadResult) {
    setLast(result);

    if (result.id && result.dre) {
      const lucroFinal =
        typeof result.dre.lucro === "number"
          ? Number(result.dre.lucro || 0)
          : calcularLucroFallback(result.dre);

      const novo: SimulacaoRow = {
        id: result.id,
        nome: result.nome ?? `Simulação - ${new Date().toLocaleString("pt-BR")}`,
        created_at: new Date().toISOString(),
        origem: "upload",
        arquivo_nome: (result as { arquivo_nome?: string | null }).arquivo_nome ?? null,

        receita_total: Number(result.dre.receitaTotal || 0),
        custo_produtos: Number(result.dre.custoProdutos || 0),
        taxas: Number(result.dre.taxas || 0),
        logistica: Number(result.dre.logistica || 0),

        lucro: lucroFinal,
        margem: Number(result.dre.margem || 0),
      };

      setSimulacoes((prev) => [novo, ...prev]);
    }

    if (result.id) router.push(`/dashboard/dre?id=${result.id}`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        {/* HERO PRO */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-xl">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />

          <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                Plano PRO ativo
              </div>

              <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">
                Lucro ML — Controle de Margem em nível PRO
              </h1>

              <p className="mt-3 text-white/75 leading-relaxed">
                Suba sua planilha e receba um diagnóstico imediato com DRE, margem e insights.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MiniStatPro label="Simulações" value={String(top.total)} />
                <MiniStatPro
                  label="Último lucro"
                  value={`R$ ${Number(top.lucro).toLocaleString("pt-BR")}`}
                />
                <MiniStatPro
                  label="Última margem"
                  value={`${Number(top.margem).toFixed(2)}%`}
                />
              </div>
            </div>

            <div className="grid gap-3">
              <FeatureCard
                title="📊 DRE Automático"
                desc="Receita, custos, taxas, lucro e margem calculados automaticamente."
              />
              <FeatureCard
                title="🚚 Full vs Flex"
                desc="Compare cenários logísticos e descubra o mais lucrativo."
              />
              <FeatureCard
                title="📈 Histórico & PDF"
                desc="Salve simulações, reabra no DRE e exporte relatórios profissionais."
              />
            </div>
          </div>
        </section>

        {/* UPLOAD */}
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold text-slate-900">
                Importar planilha do Mercado Livre
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                CSV ou Excel (.xlsx). Gera o DRE e alimenta o histórico.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700 ring-1 ring-blue-100">
                ⚡ Upload PRO
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-100">
                ✅ Processamento automático
              </span>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <UploadPlanilha onResult={onUploadResult} />
              <p className="mt-3 text-xs text-slate-500">
                Dica: após o upload, você é redirecionado para o relatório do DRE automaticamente.
              </p>
            </div>

            {last && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">
                      {last.message ?? "Upload processado."}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {last.id ? (
                        <>
                          ID: <span className="font-semibold">{last.id}</span>
                        </>
                      ) : (
                        <>Sem ID retornado (não foi possível abrir o DRE automaticamente).</>
                      )}
                    </div>
                  </div>

                  {last.id ? (
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/dre?id=${last.id}`)}
                      className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800"
                    >
                      Abrir DRE →
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* HISTÓRICO */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Histórico de simulações
              </h3>
              <p className="text-sm text-slate-600">
                Clique para abrir o relatório. Margem colorida por performance.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200">
              {simulacoes.length} registro(s)
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {simulacoes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => router.push(`/dashboard/dre?id=${s.id}`)}
                className="w-full text-left p-6 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-extrabold text-slate-900">{s.nome}</p>

                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-extrabold text-slate-700">
                      {s.origem ?? "upload"}
                    </span>

                    {s.arquivo_nome ? (
                      <span className="hidden sm:inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-extrabold text-blue-700 ring-1 ring-blue-100">
                        {s.arquivo_nome}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-sm text-slate-600">
                    {new Date(s.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>

                <div className="flex flex-col md:items-end gap-2">
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <KpiPill
                      label="Lucro"
                      value={`R$ ${Number(s.lucro || 0).toLocaleString("pt-BR")}`}
                      tone={Number(s.lucro || 0) >= 0 ? "good" : "bad"}
                    />
                    <KpiPill
                      label="Margem"
                      value={`${Number(s.margem || 0).toFixed(2)}%`}
                      tone={margemTone(Number(s.margem || 0))}
                    />
                  </div>

                  <div className="flex gap-2 md:justify-end">
                    <span className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white">
                      Ver DRE →
                    </span>
                  </div>
                </div>
              </button>
            ))}

            {!simulacoes.length && (
              <div className="p-10 text-center">
                <div className="mx-auto max-w-md rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                  <p className="text-sm font-extrabold text-slate-800">
                    Sem simulações ainda.
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Faça seu primeiro upload para gerar o DRE e salvar no histórico.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="text-center text-xs text-slate-500">
          Lucro ML • PRO • {new Date().toLocaleDateString("pt-BR")}
        </div>
      </div>
    </div>
  );
}

/* ===== UI PARTS ===== */
function MiniStatPro({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <div className="text-xs font-extrabold text-white/70">{label}</div>
      <div className="mt-1 text-lg font-extrabold tracking-tight">{value}</div>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <p className="font-extrabold">{title}</p>
      <p className="mt-1 text-sm text-white/70">{desc}</p>
    </div>
  );
}

function margemTone(m: number): "good" | "warn" | "bad" {
  if (m >= 15) return "good";
  if (m >= 8) return "warn";
  return "bad";
}

function KpiPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const styles =
    tone === "good"
      ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
      : tone === "warn"
      ? "bg-amber-50 text-amber-900 ring-1 ring-amber-100"
      : tone === "bad"
      ? "bg-rose-50 text-rose-900 ring-1 ring-rose-100"
      : "bg-slate-50 text-slate-800 ring-1 ring-slate-200";

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold ${styles}`}>
      <span className="opacity-70">{label}:</span>
      <span>{value}</span>
    </div>
  );
}
