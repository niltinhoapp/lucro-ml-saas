import CalculadoraFullFlex from "./components/CalculadoraFullFlex";

export default function FullVsFlexPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-gray-800">
          Calculadora Inteligente Full vs Flex
        </h1>
        <p className="text-gray-500">
          Descubra automaticamente qual modelo gera mais lucro
        </p>
      </div>

      <CalculadoraFullFlex />
    </div>
  );
}
