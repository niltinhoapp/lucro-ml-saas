"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function GraficoLucro({
  lucroFull,
  lucroFlex,
}: {
  lucroFull: number;
  lucroFlex: number;
}) {
  const data = [
    { tipo: "Full", lucro: Math.round(lucroFull) },
    { tipo: "Flex", lucro: Math.round(lucroFlex) },
  ];

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="font-semibold mb-4">
        Comparativo Visual de Lucro
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="tipo" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="lucro" fill="#22c55e" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
