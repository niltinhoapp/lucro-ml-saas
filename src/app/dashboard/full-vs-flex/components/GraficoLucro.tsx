"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Legend,
} from "recharts";

type Resultado = {
  receita: number;
  despesas: number;
  lucro: number;
  margem: number;
};

type ResultadoComparativo = {
  full: Resultado;
  flex: Resultado;
  melhor: "FULL" | "FLEX";
  diferencaLucro: number;
};

function moeda(v: number) {
  return Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function GraficoLucro({
  resultado,
  destaque,
}: {
  resultado: ResultadoComparativo;
  destaque: "FULL" | "FLEX";
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const data = useMemo(
    () => [
      {
        modelo: "FULL",
        Receita: Number(resultado?.full?.receita || 0),
        Despesas: Number(resultado?.full?.despesas || 0),
        Lucro: Number(resultado?.full?.lucro || 0),
      },
      {
        modelo: "FLEX",
        Receita: Number(resultado?.flex?.receita || 0),
        Despesas: Number(resultado?.flex?.despesas || 0),
        Lucro: Number(resultado?.flex?.lucro || 0),
      },
    ],
    [resultado]
  );

  const diff = Number(resultado?.diferencaLucro || 0);
  const diffAbs = Math.abs(diff);
  const diffSide = diff >= 0 ? "FULL" : "FLEX";

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>Comparação</h2>
          <p>
            Melhor: <b>{resultado.melhor}</b> • Diferença: <b>{moeda(diffAbs)}</b> • Destaque:{" "}
            <b>{destaque}</b>
          </p>
        </div>

        <div className="badges">
          <span className="badge ok">Melhor: {diffSide}</span>
        </div>
      </div>

      <div className="card-body">
        <div
          style={{
            width: "100%",
            minWidth: 0,
            height: 340,
            minHeight: 260,
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,.10)",
            background:
              "radial-gradient(900px 300px at 15% 0%, rgba(59,130,246,.12), transparent 60%), rgba(255,255,255,.03)",
            padding: 14,
            overflow: "hidden",
          }}
        >
          {!mounted ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.75,
                fontWeight: 900,
              }}
            >
              Carregando gráfico...
            </div>
          ) : (
            <ResponsiveContainer width="100%" aspect={2.2}>
              <BarChart data={data} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,.08)" />
                <XAxis
                  dataKey="modelo"
                  tick={{ fill: "rgba(229,231,235,.78)", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "rgba(229,231,235,.70)", fontSize: 12 }} />
                <Tooltip
                  formatter={(v: any, name: any) => {
                    const num = Number(v);
                    const label =
                      name === "Receita"
                        ? "Receita"
                        : name === "Despesas"
                        ? "Despesas"
                        : "Lucro";
                    return [moeda(num), label];
                  }}
                  contentStyle={{
                    background: "rgba(15,23,42,.92)",
                    border: "1px solid rgba(255,255,255,.12)",
                    borderRadius: 14,
                    color: "rgba(229,231,235,.92)",
                  }}
                  labelStyle={{ color: "rgba(229,231,235,.85)", fontWeight: 900 }}
                />
                <Legend wrapperStyle={{ color: "rgba(229,231,235,.75)" }} />

                <Bar dataKey="Receita" fill="rgba(59,130,246,.90)" radius={[12, 12, 0, 0]} />
                <Bar dataKey="Despesas" fill="rgba(245,158,11,.85)" radius={[12, 12, 0, 0]} />
                <Bar dataKey="Lucro" fill="rgba(34,197,94,.85)" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
}