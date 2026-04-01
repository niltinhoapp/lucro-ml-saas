import PlanGate from "@/components/paywall/PlanGate";
import SimuladorEstoqueClient from "@/components/market/SimuladorEstoqueClient";

export default function SimuladorPage() {
  return (
    <PlanGate
      requiredPlan="pro"
      title="Simulador de lucro para compra de estoque"
      description="Antes de investir em um lote, veja quanto dinheiro será imobilizado, qual lucro pode voltar para o caixa e em quanto tempo esse estoque tende a girar."
      bullets={[
        "Evite comprar produtos com margem ruim.",
        "Veja lucro estimado, retorno e tempo de giro antes de investir.",
      ]}
    >
      <SimuladorEstoqueClient />
    </PlanGate>
  );
}