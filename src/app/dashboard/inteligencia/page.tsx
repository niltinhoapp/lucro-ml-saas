import PlanGate from "@/components/paywall/PlanGate";
import MarketIntelligenceClient from "@/components/market/MarketIntelligenceClient";

export default function InteligenciaPage() {
  return (
    <PlanGate
      requiredPlan="pro"
      title="Inteligência de mercado para decidir melhor"
      description="No PRO, você analisa cenário, demanda, concorrência e potencial de produto com mais clareza antes de comprar, testar ou escalar uma oportunidade."
      bullets={[
        "Entenda risco, demanda e espaço de mercado com mais contexto.",
        "Tome decisões de produto com mais segurança e menos achismo.",
      ]}
    >
      <MarketIntelligenceClient />
    </PlanGate>
  );
}




