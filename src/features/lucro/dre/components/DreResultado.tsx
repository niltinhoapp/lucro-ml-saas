"use client";

import { calcularDre } from "@/lib/dre/calcularDre";
import { LinhaVenda } from "@/lib/dre/calcularDre";

export default function DreResultado({
  linhas,
}: {
  linhas: LinhaVenda[];
}) {
  if (!linhas.length) {
    return (
      <div className="text-gray-500 text-sm">
        Nenhum dado carregado ainda.
      </div>
    );
  }

  const dre = calcularDre(linhas);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800">
          DRE Automático
        </h2>
        <p className="text-gray-500">
          Resultado gerado a partir da sua planilha
        </p>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card title="Receita" value={dre.receitaTotal} />
        <Card title="Custos" value={dre.custoProdutos} />
        <Card title="Taxas" value={dre.taxas} />
        <Card title="Logística" value={dre.logistica} />
        <Card title="Lucro" value={dre.lucro} highlight />
        <Card
          title="Margem"
          value={`${dre.margem}%`}
          highlight
        />
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  highlight,
}: {
  title: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p
        className={`text-xl font-bold ${
          highlight ? "text-green-600" : "text-gray-800"
        }`}
      >
        {typeof value === "number"
          ? `R$ ${value.toLocaleString()}`
          : value}
      </p>
    </div>
  );
}




