"use client";

import { useMemo } from "react";
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

export default function DashboardHomeClient({ simulacoes }: Props) {
  const router = useRouter();

  // trocar depois pelo plano real vindo do banco
  const userPlan = "plus";

  const plusStrategies = useMemo(() => {
    return mockStrategies.filter((item) => item.accessLevel === "plus");
  }, []);

  const unreadStrategies = useMemo(() => {
    return plusStrategies.filter((item) => !item.isRead);
  }, [plusStrategies]);

  const strategyOfWeek = useMemo(() => {
    return unreadStrategies[0] ?? plusStrategies[0] ?? null;
  }, [unreadStrategies, plusStrategies]);

  function handleUploadResult(result: UploadResult) {
    if (result?.id) {
      router.push(`/dashboard/dre?id=${result.id}`);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-10">
      {userPlan === "plus" && (
        <StrategyNotificationCard
          unreadCount={unreadStrategies.length}
          strategy={strategyOfWeek}
        />
      )}

      <section className="p-8 bg-white shadow rounded-2xl">
        <div className="max-w-3xl space-y-3">
          <h1 className="text-3xl font-bold text-gray-900">Painel</h1>

          <p className="text-gray-600">
            Importe sua planilha e acompanhe seus resultados.
          </p>
        </div>
      </section>

      <section className="p-6 bg-white shadow rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Importar planilha
            </h2>

            <p className="text-gray-500">Envie CSV ou Excel (.xlsx).</p>
          </div>

          <span className="px-3 py-1 text-xs font-semibold text-blue-700 rounded-full bg-blue-50">
            PRO
          </span>
        </div>

        <div className="mt-4">
          <UploadPlanilha onResult={handleUploadResult} />
        </div>
      </section>

      <section className="p-6 bg-white shadow rounded-2xl">
        <HistoricoSimulacoes simulacoes={simulacoes} />
      </section>
    </div>
  );
}




