import { FormState } from "./CalculadoraFullFlex";

export default function HistoricoSimulacoes({
  historico,
}: {
  historico: FormState[];
}) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="font-semibold mb-4">
        Histórico de Simulações (PRO)
      </h3>

      {historico.length === 0 && (
        <p className="text-gray-400 text-sm">
          Nenhuma simulação salva ainda
        </p>
      )}

      {historico.map((item, i) => (
        <div
          key={i}
          className="border-b py-2 text-sm flex justify-between"
        >
          <span>Preço: R$ {item.preco}</span>
          <span>Qtd: {item.qtd}</span>
          <span>
            Margem:
            {item.preco - item.custo > 0 ? " Positiva" : " Negativa"}
          </span>
        </div>
      ))}
    </div>
  );
}
