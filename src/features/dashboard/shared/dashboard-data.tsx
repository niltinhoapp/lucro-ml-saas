
import type { LucideIcon } from "lucide-react";
import { Boxes, BrainCircuit, CircleDollarSign, Link2, ShoppingBag, Wallet } from "lucide-react";

export type UserPlan = "free_trial" | "plus" | "pro" | "preview";
export type PlanGate = "plus" | "pro";

export type QuickAction = {
  title: string;
  description: string;
  href: string;
  requiredPlan?: PlanGate;
  highlight?: boolean;
};

export type ModuleItem = {
  label: string;
  description: string;
  href: string;
  requiredPlan?: PlanGate;
};

export type ModuleCard = {
  title: string;
  summary: string;
  icon: "produtos" | "lucro" | "operacao" | "estrategia" | "ajuda" | "conta";
  href: string;
  items: ModuleItem[];
};

export const quickActions: QuickAction[] = [
  {
    title: "Radar ML",
    description: "Descubra produtos com boa procura e menor concorrência.",
    href: "/dashboard/produtos/radar",
    requiredPlan: "plus",
    highlight: true,
  },
  {
    title: "Lucro real",
    description: "Veja margem real da operação com DRE, taxas e caixa.",
    href: "/dashboard/lucro/dre",
    requiredPlan: "pro",
  },
  {
    title: "Simular compra",
    description: "Teste uma compra antes de investir em estoque.",
    href: "/dashboard/operacao/simulador",
    requiredPlan: "pro",
  },
];

export const moduleCards: ModuleCard[] = [
  {
    title: "Produtos",
    summary: "Ferramentas para encontrar produto, analisar mercado e descobrir oportunidades.",
    icon: "produtos",
    href: "/dashboard/produtos",
    items: [
      {
        label: "Radar ML",
        description: "Analise demanda, concorrência e oportunidade antes de comprar estoque.",
        href: "/dashboard/produtos/radar",
        requiredPlan: "plus",
      },
      {
        label: "Catálogos de fornecedor",
        description: "Leia catálogos e descubra produtos com potencial para anúncio.",
        href: "/dashboard/produtos/catalogos",
        requiredPlan: "plus",
      },
      {
        label: "Estratégias ML",
        description: "Acesse estratégias práticas para vender melhor no Mercado Livre.",
        href: "/dashboard/produtos/estrategias",
        requiredPlan: "plus",
      },
    ],
  },
  {
    title: "Lucro",
    summary: "Controle financeiro da operação para proteger margem e tomar decisões melhores.",
    icon: "lucro",
    href: "/dashboard/lucro",
    items: [
      {
        label: "Diagnóstico de lucro",
        description: "Veja rapidamente onde sua operação perde margem.",
        href: "/dashboard/lucro/diagnostico",
        requiredPlan: "pro",
      },
      {
        label: "Lucro real e DRE",
        description: "Organize taxas, custos e resultado final do negócio.",
        href: "/dashboard/lucro/dre",
        requiredPlan: "pro",
      },
      {
        label: "Fluxo de caixa",
        description: "Acompanhe entradas, saídas e fôlego financeiro da operação.",
        href: "/dashboard/lucro/fluxo-caixa",
        requiredPlan: "pro",
      },
      {
        label: "Full vs Flex",
        description: "Compare cenários logísticos e entenda o melhor caminho.",
        href: "/dashboard/lucro/full-vs-flex",
        requiredPlan: "pro",
      },
    ],
  },
  {
    title: "Operação",
    summary: "Ferramentas para testar compras, montar kits e priorizar ações do dia a dia.",
    icon: "operacao",
    href: "/dashboard/operacao",
    items: [
      {
        label: "Simulador de compra",
        description: "Avalie risco, retorno e capital antes de comprar estoque.",
        href: "/dashboard/operacao/simulador",
        requiredPlan: "pro",
      },
      {
        label: "Gerador de kits",
        description: "Monte combinações para elevar ticket médio e giro do anúncio.",
        href: "/dashboard/operacao/kits",
        requiredPlan: "pro",
      },
      {
        label: "Inteligência de mercado",
        description: "Receba apoio para decidir o que priorizar no negócio.",
        href: "/dashboard/operacao/inteligencia",
        requiredPlan: "pro",
      },
    ],
  },
  {
    title: "Estratégia",
    summary: "Ajuda prática para usar melhor a plataforma e evoluir seu plano.",
    icon: "estrategia",
    href: "/dashboard/estrategia",
    items: [
      {
        label: "Ajuda para seller",
        description: "Veja por onde começar e como usar os módulos.",
        href: "/dashboard/ajuda",
      },
      {
        label: "Planos e upgrade",
        description: "Compare os planos e desbloqueie novos recursos.",
        href: "/checkout",
      },
    ],
  },
  {
    title: "Conta",
    summary: "Integrações, conexão com Mercado Livre e gestão do plano da conta.",
    icon: "conta",
    href: "/dashboard/conta",
    items: [
      {
        label: "Integrações ML",
        description: "Conecte sua conta do Mercado Livre e acompanhe o status.",
        href: "/dashboard/conta",
        requiredPlan: "plus",
      },
      {
        label: "Planos e upgrade",
        description: "Gerencie ou altere seu plano atual.",
        href: "/checkout",
      },
    ],
  },
];

export const dashboardIconMap: Record<ModuleCard["icon"], LucideIcon> = {
  produtos: ShoppingBag,
  lucro: CircleDollarSign,
  operacao: Boxes,
  estrategia: BrainCircuit,
  ajuda: Wallet,
  conta: Link2,
};

export function getPlanLabel(plan: UserPlan) {
  if (plan === "free_trial") return "FREE";
  if (plan === "plus") return "PLUS";
  if (plan === "pro") return "PRO";
  return "PREVIEW";
}

export function canAccess(plan: UserPlan, requiredPlan?: PlanGate) {
  if (!requiredPlan) return true;
  if (plan === "plus") return true;
  if (plan === "pro") return requiredPlan === "pro";
  return false;
}

export function shouldShowBadge(currentPlan: UserPlan, requiredPlan?: PlanGate) {
  if (!requiredPlan) return false;
  if (requiredPlan === "pro") {
    return currentPlan !== "pro" && currentPlan !== "plus";
  }
  return currentPlan !== "plus";
}

export function getUpgradeHref(targetPlan?: PlanGate) {
  if (targetPlan === "plus") return "/checkout?plan=plus";
  if (targetPlan === "pro") return "/checkout?plan=pro";
  return "/checkout";
}

