export default function ResultadoCards({
  resultado,
}: {
  resultado: {
    receita: number;
    lucroFull: number;
    lucroFlex: number;
  };
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow p-5">
        <p className="text-gray-500">Receita Total</p>
        <p className="text-2xl font-bold">
          R$ {resultado.receita.toLocaleString()}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <p className="text-gray-500">Lucro FULL</p>
        <p className="text-2xl font-bold text-blue-600">
          R$ {resultado.lucroFull.toLocaleString()}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <p className="text-gray-500">Lucro FLEX</p>
        <p className="text-2xl font-bold text-orange-500">
          R$ {resultado.lucroFlex.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
