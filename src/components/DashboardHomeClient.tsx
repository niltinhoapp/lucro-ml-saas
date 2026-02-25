"use client";

import { useState } from "react";
import UploadPlanilha, { type UploadResult } from "@/components/UploadPlanilha";
import HistoricoSimulacoes, { type Simulacao } from "@/components/HistoricoSimulacoes";

export default function DashboardHomeClient({
  simulacoes,
}: {
  simulacoes: Simulacao[];
}) {
  const [lastUpload, setLastUpload] = useState<UploadResult | null>(null);

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Lucro ML — Inteligência de Margem
        </h1>
        <p className="text-gray-600 mt-2">
          DRE automático, comparação FULL vs FLEX e decisões baseadas em dados reais do Mercado Livre.
        </p>
      </div>

      {/* CARDS DE VALOR */}
      <div className="grid md:grid-cols-3 gap-4">
        <ValueCard
          title="📊 DRE Automático"
          desc="Receita, custos, taxas, lucro e margem calculados automaticamente."
        />
        <ValueCard
          title="🚚 Full vs Flex"
          desc="Compare cenários logísticos e descubra o mais lucrativo."
        />
        <ValueCard
          title="📈 Histórico & PDF"
          desc="Salve simulações, reabra no DRE e exporte relatórios profissionais."
        />
      </div>

      {/* UPLOAD */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">
              Importar planilha do Mercado Livre
            </h2>
            <p className="text-gray-500">
              Envie CSV ou Excel (.xlsx). Recurso exclusivo do plano <strong>PRO</strong>.
            </p>
          </div>

          {lastUpload?.id ? (
            <span className="text-xs px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
              ✅ Upload salvo
            </span>
          ) : (
            <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              ⚡ Upload PRO
            </span>
          )}
        </div>

        <div className="mt-4">
          <UploadPlanilha onResult={(data) => setLastUpload(data)} />
        </div>

        {lastUpload?.message && (
          <div className="mt-4 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
            {lastUpload.message}
          </div>
        )}
      </div>

      {/* HISTÓRICO */}
     <HistoricoSimulacoes simulacoes={simulacoes} />

    </div>
  );
}

function ValueCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-gray-500 text-sm mt-1">{desc}</p>
    </div>
  );
}
