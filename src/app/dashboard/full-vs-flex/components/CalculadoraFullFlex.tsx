"use client";

import { useMemo, useState } from "react";
import ResultadoCards from "./ResultadoCards";
import GraficoLucro from "./GraficoLucro";
import HistoricoSimulacoes from "./HistoricoSimulacoes";

export type FormState = {
  preco: number;
  custo: number;
  taxa: number;
  full: number;
  flex: number;
  qtd: number;
};

export default function CalculadoraFullFlex() {
  const [form, setForm] = useState<FormState>({
    preco: 120,
    custo: 60,
    taxa: 16,
    full: 25,
    flex: 18,
    qtd: 100,
  });

  const [historico, setHistorico] = useState<FormState[]>([]);

  const fields: { label: string; key: keyof FormState }[] = [
    { label: "Preço de Venda (R$)", key: "preco" },
    { label: "Custo do Produto (R$)", key: "custo" },
    { label: "Taxa ML (%)", key: "taxa" },
    { label: "Custo Full (R$)", key: "full" },
    { label: "Custo Flex (R$)", key: "flex" },
    { label: "Quantidade", key: "qtd" },
  ];

  const resultado = useMemo(() => {
    const receita = form.preco * form.qtd;
    const taxaML = receita * (form.taxa / 100);

    const lucroFull =
      receita - form.custo * form.qtd - taxaML - form.full * form.qtd;

    const lucroFlex =
      receita - form.custo * form.qtd - taxaML - form.flex * form.qtd;

    return {
      receita,
      lucroFull,
      lucroFlex,
      melhor:
        lucroFull > lucroFlex
          ? "FULL é mais vantajoso neste cenário"
          : "FLEX é mais vantajoso neste cenário",
    };
  }, [form]);

  return (
    <div className="space-y-10">
      {/* FORM */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold text-lg mb-4">
          Dados da Simulação
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="text-sm text-gray-600">
                {field.label}
              </label>
              <input
                type="number"
                value={form[field.key]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [field.key]: Number(e.target.value),
                  })
                }
                className="mt-1 w-full rounded-lg border px-3 py-2
                           focus:outline-none focus:ring-2
                           focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => setHistorico([...historico, form])}
          className="mt-6 bg-blue-600 text-white px-5 py-2
                     rounded-lg hover:bg-blue-700 transition"
        >
          Salvar simulação (PRO)
        </button>
      </div>

      {/* RESULTADOS */}
      <ResultadoCards resultado={resultado} />

      {/* GRÁFICO */}
      <GraficoLucro
        lucroFull={resultado.lucroFull}
        lucroFlex={resultado.lucroFlex}
      />

      {/* INSIGHT */}
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        <strong>Insight automático:</strong> {resultado.melhor}
      </div>

      {/* HISTÓRICO */}
      <HistoricoSimulacoes historico={historico} />
    </div>
  );
}
