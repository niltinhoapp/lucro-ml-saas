import PlanGate from "@/components/paywall/PlanGate";
import InteligenciaView from "./InteligenciaView";

export default function InteligenciaPage() {
  return (
    <PlanGate
      requiredPlan="plus"
      title="Inteligência para analisar catálogos"
      description="Envie catálogos de fornecedor e receba uma leitura prática dos itens, riscos e sinais de oportunidade."
      bullets={[
        "Transforme PDF em leitura prática",
        "Priorize o que vale revisar, testar ou descartar",
      ]}
    >
      <InteligenciaView />
    </PlanGate>
  );
}