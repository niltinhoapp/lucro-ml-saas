"use client";

interface Props {
  hasSimulacoes: boolean;
}

export default function Onboarding({ hasSimulacoes }: Props) {
  if (hasSimulacoes) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
      <h2 className="text-2xl font-semibold text-blue-800">
        👋 Bem-vindo ao Lucro ML
      </h2>

      <p className="text-blue-700">
        Aqui você descobre o <strong>lucro real</strong> dos seus produtos
        no Mercado Livre em poucos segundos.
      </p>

      <ol className="list-decimal ml-5 text-blue-700 space-y-1">
        <li>Importe sua planilha do Mercado Livre</li>
        <li>Veja o DRE automático</li>
        <li>Descubra se FULL ou FLEX é mais lucrativo</li>
      </ol>

      <div className="pt-4">
        <p className="font-medium text-blue-800 mb-2">
          👉 Comece agora:
        </p>
        <p className="text-sm text-blue-700">
          Envie sua planilha e veja os resultados automaticamente.
        </p>
      </div>
    </div>
  );
}
