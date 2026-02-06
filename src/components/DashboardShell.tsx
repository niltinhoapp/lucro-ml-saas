"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import UploadPlanilha, { UploadResult } from "@/components/UploadPlanilha";
import type { SimulacaoRow } from "@/types/simulacoes";

export default function DashboardShell({
  initialSimulacoes,
}: {
  initialSimulacoes: SimulacaoRow[];
}) {
  const router = useRouter();
  const [simulacoes, setSimulacoes] = useState<SimulacaoRow[]>(initialSimulacoes);

  const top = useMemo(() => {
    const latest = simulacoes[0];
    return {
      total: simulacoes.length,
      lucro: latest?.lucro ?? 0,
      margem: latest?.margem ?? 0,
    };
  }, [simulacoes]);

  function onUploadResult(result: UploadResult) {
    // se veio id, manda pro DRE
    if (result.id) router.push(`/dashboard/dre?id=${result.id}`);

    // se quiser “atualizar lista” de verdade: melhor criar um GET /api/simulacoes e refetch.
    // aqui é um "update bonito" parcial
    if (result.id && result.dre) {
      const novo: SimulacaoRow = {
        id: result.id,
        nome: `Simulação - ${new Date().toLocaleString("pt-BR")}`,
        created_at: new Date().toISOString(),
        origem: "upload",
        arquivo_nome: null,
        receita_total: result.dre.receitaTotal,
        lucro: result.dre.lucro,
        margem: result.dre.margem,
      };
      setSimulacoes((prev) => [novo, ...prev]);
    }
  }

  return (
    <div className="space-y-10">
      {/* HERO */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 shadow">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-semibold">
            Lucro ML — Controle de Margem em nível PRO
          </h1>
          <p className="text-white/70 mt-3">
            Suba sua planilha e receba um diagnóstico imediato com DRE, margem e insights.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <MiniStat label="Simulações" value={String(top.total)} />
            <MiniStat label="Último lucro" value={`R$ ${top.lucro.toLocaleString("pt-BR")}`} />
            <MiniStat label="Última margem" value={`${top.margem.toFixed(2)}%`} />
          </div>
        </div>
      </div>

      {/* UPLOAD */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Importar planilha</h2>
            <p className="text-gray-500 mt-1">
              CSV ou Excel (.xlsx). Isso alimenta o histórico e gera o DRE automático.
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
            PRO
          </span>
        </div>

        <div className="mt-4">
          <UploadPlanilha onResult={onUploadResult} />
        </div>
      </div>

      {/* HISTÓRICO (simples e bonito) */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="p-5 border-b">
          <h3 className="font-semibold text-gray-900">Histórico de simulações</h3>
          <p className="text-sm text-gray-500">Clique para abrir o relatório.</p>
        </div>

        <div className="divide-y">
          {simulacoes.map((s) => (
            <button
              key={s.id}
              onClick={() => router.push(`/dashboard/dre?id=${s.id}`)}
              className="w-full text-left p-5 hover:bg-gray-50 transition flex items-center justify-between gap-4"
            >
              <div>
                <div className="font-medium text-gray-900">{s.nome}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(s.created_at).toLocaleString("pt-BR")} • {s.origem}
                  {s.arquivo_nome ? ` • ${s.arquivo_nome}` : ""}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  R$ {Number(s.lucro || 0).toLocaleString("pt-BR")}
                </div>
                <div className="text-xs text-gray-500">{Number(s.margem || 0).toFixed(2)}%</div>
              </div>
            </button>
          ))}
          {!simulacoes.length && (
            <div className="p-6 text-sm text-gray-500">Sem simulações ainda. Faça seu primeiro upload.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 border border-white/10 p-4">
      <div className="text-xs text-white/60">{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}
