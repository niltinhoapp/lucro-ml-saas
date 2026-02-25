"use client";

import { useRouter } from "next/navigation";
import UploadPlanilha from "@/components/UploadPlanilha";
import type { UploadResult } from "@/components/UploadPlanilha";

import HistoricoSimulacoes, { type Simulacao } from "@/components/HistoricoSimulacoes";

type Props = {
  simulacoes: Simulacao[];
};


export default function DashboardHomeClient({ simulacoes }: Props) {
  const router = useRouter();

  function handleUploadResult(result: UploadResult) {
    // Se sua API retorna { id, dre }, leva o usuário direto pro DRE da simulação
    if (result?.id) {
      router.push(`/dashboard/dre?id=${result.id}`);
      return;
    }
    // fallback: fica na home mesmo
    router.refresh();
  }

  return (
    <div className="space-y-10">
      {/* HERO */}
      <section className="rounded-2xl p-8 bg-white shadow">
        <div className="max-w-3xl space-y-3">
          <h1 className="text-3xl font-bold text-gray-900">
            Lucro ML — Inteligência de Margem
          </h1>
          <p className="text-gray-600">
            DRE automático, comparação FULL vs FLEX e decisões baseadas em dados reais do Mercado Livre.
          </p>

          <div className="grid md:grid-cols-3 gap-4 pt-4">
            <ValueCard
              title="📊 DRE Automático"
              desc="Receita, custos, taxas, lucro e margem calculados automaticamente."
            />
            <ValueCard
              title="🚚 Full vs Flex"
              desc="Simule custos logísticos e descubra o cenário mais lucrativo."
            />
            <ValueCard
              title="📈 Histórico & PDF"
              desc="Salve simulações e exporte relatórios profissionais."
            />
          </div>
        </div>
      </section>

      {/* UPLOAD PRO */}
      <section className="bg-white rounded-2xl shadow p-6 space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Importar planilha do Mercado Livre
            </h2>
            <p className="text-gray-500">
              Envie CSV ou Excel (.xlsx). Recurso exclusivo do plano <strong>PRO</strong>.
            </p>
          </div>

          <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold">
            PRO
          </span>
        </div>

        <UploadPlanilha onResult={handleUploadResult} />
      </section>

      {/* HISTÓRICO */}
      <section className="bg-white rounded-2xl shadow p-6">
        <HistoricoSimulacoes simulacoes={simulacoes} />
      </section>
    </div>
  );
}

function ValueCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4 hover:shadow-sm transition bg-white">
      <div className="font-semibold text-gray-900">{title}</div>
      <div className="text-sm text-gray-500 mt-1">{desc}</div>
    </div>
  );
}
