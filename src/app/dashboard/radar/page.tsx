import PlanGate from "@/components/paywall/PlanGate";
import RadarOportunidades from "@/components/market/RadarOportunidades";

export default function RadarPage() {
  return (
    <PlanGate
      requiredPlan="plus"
      title="Radar de oportunidades"
      description="Pesquise um produto e veja rapidamente se vale a pena vender no Mercado Livre."
      bullets={[
        "Descubra produtos com boa procura.",
        "Veja o nível de concorrência antes de investir em estoque.",
        "Entenda o preço médio praticado no Mercado Livre.",
      ]}
    >
      <RadarOportunidades />
    </PlanGate>
  );
}