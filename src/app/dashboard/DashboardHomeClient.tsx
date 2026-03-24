"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UploadPlanilha from "@/features/upload/components/UploadPlanilha";
import type { UploadResult } from "@/features/upload/components/UploadPlanilha";
import HistoricoSimulacoes, {
  type Simulacao,
} from "@/components/HistoricoSimulacoes";
import { mockStrategies } from "@/data/mockStrategies";
import StrategyNotificationCard from "@/components/strategies/StrategyNotificationCard";

type Props = {
  simulacoes: Simulacao[];
};

type RadarItem = {
  produto: string;
  custo: number;
  margem: number;
  oportunidade: number;
  risco: "baixo" | "medio" | "alto";
  recomendacao: string;
};

type RadarResponse = {
  ok: boolean;
  radar: {
    top: RadarItem[];
    evitar: RadarItem[];
    ajustar: RadarItem[];
    resumo: string[];
  } | null;
  message?: string;
  error?: string;
};

function currency(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function riskBadgeClass(risco: RadarItem["risco"]) {
  if (risco === "baixo") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  }

  if (risco === "alto") {
    return "bg-rose-50 text-rose-700 border border-rose-100";
  }

  return "bg-amber-50 text-amber-700 border border-amber-100";
}

function opportunityTone(score: number) {
  if (score >= 75) return "text-emerald-600";
  if (score >= 55) return "text-amber-600";
  return "text-rose-600";
}

export default function DashboardHomeClient({ simulacoes }: Props) {
  const router = useRouter();

  const userPlan = "plus";

  const [radar, setRadar] = useState<RadarResponse["radar"]>(null);
  const [radarLoading, setRadarLoading] = useState(true);
  const [radarError, setRadarError] = useState<string | null>(null);

  const plusStrategies = useMemo(() => {
    return mockStrategies.filter((item) => item.accessLevel === "plus");
  }, []);

  const unreadStrategies = useMemo(() => {
    return plusStrategies.filter((item) => !item.isRead);
  }, [plusStrategies]);

  const strategyOfWeek = useMemo(() => {
    return unreadStrategies[0] ?? plusStrategies[0] ?? null;
  }, [unreadStrategies, plusStrategies]);

  const radarTop = useMemo(() => radar?.top ?? [], [radar]);
  const radarEvitar = useMemo(() => radar?.evitar ?? [], [radar]);
  const radarAjustar = useMemo(() => radar?.ajustar ?? [], [radar]);

  useEffect(() => {
    let active = true;

    async function loadRadar() {
      try {
        setRadarLoading(true);
        setRadarError(null);

        const response = await fetch("/api/radar", {
          method: "GET",
          cache: "no-store",
        });

        const data: RadarResponse = await response.json();

        if (!active) return;

        if (!response.ok || !data.ok) {
          setRadar(null);
          setRadarError(data.error || data.message || "Falha ao carregar radar.");
          return;
        }

        setRadar(data.radar ?? null);
      } catch (error) {
        if (!active) return;
        console.error("[dashboard radar] erro:", error);
        setRadar(null);
        setRadarError("Não foi possível carregar o Radar agora.");
      } finally {
        if (active) {
          setRadarLoading(false);
        }
      }
    }

    if (userPlan === "plus") {
      loadRadar();
    } else {
      setRadarLoading(false);
    }

    return () => {
      active = false;
    };
  }, [userPlan]);

  function handleUploadResult(result: UploadResult) {
    if (result?.id) {
      router.push(`/dashboard/lucro/dre?id=${result.id}`);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-8">
      {userPlan === "plus" && (
        <StrategyNotificationCard
          unreadCount={unreadStrategies.length}
          strategy={strategyOfWeek}
        />
      )}

      <section className="p-8 bg-white border shadow-sm rounded-3xl border-slate-200">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex px-3 py-1 text-xs font-semibold border rounded-full border-emerald-100 bg-emerald-50 text-emerald-700">
              Painel executivo
            </span>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Visão rápida da sua operação
            </h1>

            <p className="text-base text-slate-600">
              Acompanhe suas simulações, envie arquivos e veja onde estão as
              melhores oportunidades para margem, giro e decisão de compra.
            </p>
          </div>

          <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="p-4 border rounded-2xl border-slate-200 bg-slate-50">
              <div className="text-xs font-medium tracking-wide uppercase text-slate-500">
                Simulações
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {simulacoes.length}
              </div>
            </div>

            <div className="p-4 border rounded-2xl border-slate-200 bg-slate-50">
              <div className="text-xs font-medium tracking-wide uppercase text-slate-500">
                Estratégias novas
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {unreadStrategies.length}
              </div>
            </div>

            <div className="p-4 border rounded-2xl border-slate-200 bg-slate-50">
              <div className="text-xs font-medium tracking-wide uppercase text-slate-500">
                Plano atual
              </div>
              <div className="mt-2 text-2xl font-bold uppercase text-slate-900">
                {userPlan}
              </div>
            </div>
          </div>
        </div>
      </section>

      {userPlan === "plus" && (
        <section className="p-6 bg-white border shadow-sm rounded-3xl border-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100 rounded-full bg-indigo-50">
                Radar IA
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Oportunidades mais promissoras agora
              </h2>

              <p className="max-w-2xl text-sm text-slate-600">
                O Radar cruza margem estimada, demanda e concorrência para te
                mostrar o que merece teste, o que precisa ajuste e o que é
                melhor evitar.
              </p>
            </div>

            <Link
              href="/dashboard/produtos/radar"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold transition border rounded-2xl border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Abrir Radar completo
            </Link>
          </div>

          <div className="mt-6">
            {radarLoading ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="p-5 border rounded-2xl border-slate-200 bg-slate-50"
                  >
                    <div className="w-24 h-4 rounded animate-pulse bg-slate-200" />
                    <div className="mt-4 space-y-3">
                      <div className="w-full h-4 rounded animate-pulse bg-slate-200" />
                      <div className="w-4/5 h-4 rounded animate-pulse bg-slate-200" />
                      <div className="w-full h-10 rounded animate-pulse bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : radarError ? (
              <div className="p-5 text-sm border rounded-2xl border-rose-100 bg-rose-50 text-rose-700">
                {radarError}
              </div>
            ) : !radar ? (
              <div className="p-5 text-sm border rounded-2xl border-slate-200 bg-slate-50 text-slate-600">
                Assim que houver itens analisados, o Radar aparece aqui com os
                melhores produtos para testar.
              </div>
            ) : (
              <div className="space-y-6">
                {!!radar.resumo?.length && (
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                    {radar.resumo.map((item) => (
                      <div
                        key={item}
                        className="p-4 text-sm font-medium border rounded-2xl border-slate-200 bg-slate-50 text-slate-700"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                  <div className="p-5 border rounded-2xl border-emerald-100 bg-emerald-50/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-slate-900">
                        Top oportunidades
                      </h3>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {radarTop.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {radarTop.length ? (
                        radarTop.map((item) => (
                          <div
                            key={`${item.produto}-${item.custo}`}
                            className="p-4 bg-white border border-white shadow-sm rounded-2xl"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {item.produto}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  Custo: {currency(item.custo)}
                                </p>
                              </div>

                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${riskBadgeClass(
                                  item.risco
                                )}`}
                              >
                                {item.risco}
                              </span>
                            </div>

                            <div className="flex items-center justify-between mt-3 text-sm">
                              <span className="text-slate-500">Margem</span>
                              <span className="font-semibold text-slate-900">
                                {item.margem.toFixed(1)}%
                              </span>
                            </div>

                            <div className="flex items-center justify-between mt-2 text-sm">
                              <span className="text-slate-500">Oportunidade</span>
                              <span
                                className={`font-bold ${opportunityTone(
                                  item.oportunidade
                                )}`}
                              >
                                {item.oportunidade}
                              </span>
                            </div>

                            <p className="mt-3 text-sm text-slate-600">
                              {item.recomendacao}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-sm bg-white border border-dashed rounded-2xl border-emerald-200 text-slate-600">
                          Ainda não há oportunidades fortes suficientes.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 border rounded-2xl border-amber-100 bg-amber-50/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-slate-900">
                        Ajustar antes
                      </h3>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-700">
                        {radarAjustar.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {radarAjustar.length ? (
                        radarAjustar.map((item) => (
                          <div
                            key={`${item.produto}-${item.custo}`}
                            className="p-4 bg-white border border-white shadow-sm rounded-2xl"
                          >
                            <p className="font-semibold text-slate-900">
                              {item.produto}
                            </p>

                            <div className="flex items-center justify-between mt-3 text-sm">
                              <span className="text-slate-500">Margem</span>
                              <span className="font-semibold text-slate-900">
                                {item.margem.toFixed(1)}%
                              </span>
                            </div>

                            <div className="flex items-center justify-between mt-2 text-sm">
                              <span className="text-slate-500">Oportunidade</span>
                              <span
                                className={`font-bold ${opportunityTone(
                                  item.oportunidade
                                )}`}
                              >
                                {item.oportunidade}
                              </span>
                            </div>

                            <p className="mt-3 text-sm text-slate-600">
                              {item.recomendacao}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-sm bg-white border border-dashed rounded-2xl border-amber-200 text-slate-600">
                          Nenhum produto em zona intermediária no momento.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 border rounded-2xl border-rose-100 bg-rose-50/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-slate-900">
                        Melhor evitar
                      </h3>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-rose-700">
                        {radarEvitar.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {radarEvitar.length ? (
                        radarEvitar.map((item) => (
                          <div
                            key={`${item.produto}-${item.custo}`}
                            className="p-4 bg-white border border-white shadow-sm rounded-2xl"
                          >
                            <p className="font-semibold text-slate-900">
                              {item.produto}
                            </p>

                            <div className="flex items-center justify-between mt-3 text-sm">
                              <span className="text-slate-500">Margem</span>
                              <span className="font-semibold text-slate-900">
                                {item.margem.toFixed(1)}%
                              </span>
                            </div>

                            <div className="flex items-center justify-between mt-2 text-sm">
                              <span className="text-slate-500">Oportunidade</span>
                              <span
                                className={`font-bold ${opportunityTone(
                                  item.oportunidade
                                )}`}
                              >
                                {item.oportunidade}
                              </span>
                            </div>

                            <p className="mt-3 text-sm text-slate-600">
                              {item.recomendacao}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-sm bg-white border border-dashed rounded-2xl border-rose-200 text-slate-600">
                          Nenhum alerta forte encontrado agora.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="p-6 bg-white border shadow-sm rounded-3xl border-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">
              Importar planilha
            </h2>
            <p className="text-sm text-slate-500">
              Envie CSV ou Excel (.xlsx) para analisar resultados e alimentar
              seus próximos ajustes.
            </p>
          </div>

          <span className="px-3 py-1 text-xs font-semibold text-blue-700 rounded-full bg-blue-50">
            PRO
          </span>
        </div>

        <div className="mt-5">
          <UploadPlanilha onResult={handleUploadResult} />
        </div>
      </section>

      <section className="p-6 bg-white border shadow-sm rounded-3xl border-slate-200">
        <HistoricoSimulacoes simulacoes={simulacoes} />
      </section>
    </div>
  );
}