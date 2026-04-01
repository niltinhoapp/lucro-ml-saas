"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  BrainCircuit,
  ChevronRight,
  CircleDollarSign,
  FolderOpen,
  HelpCircle,
  LayoutDashboard,
  Lock,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import UpgradeModal from "@/ui/UpgradeModal";

export type UserPlan = "free" | "preview" | "pro" | "plus";

type PlanGate = "pro" | "plus";

export type SidebarItem = {
  label: string;
  href: string;
  requiredPlan?: PlanGate;
  description?: string;
};

export type SidebarModule = {
  title: string;
  icon:
    | "produtos"
    | "lucro"
    | "operacao"
    | "estrategia"
    | "ajuda"
    | "conta";
  defaultOpen?: boolean;
  items: SidebarItem[];
};

const iconMap = {
  produtos: ShoppingBag,
  lucro: CircleDollarSign,
  operacao: Boxes,
  estrategia: BrainCircuit,
  ajuda: HelpCircle,
  conta: Wallet,
} as const;

function canAccess(plan: UserPlan, requiredPlan?: PlanGate) {
  if (!requiredPlan) return true;
  if (plan === "plus") return true;
  if (plan === "pro") return requiredPlan === "pro";
  return false;
}

function getUpgradeLink(requiredPlan?: PlanGate) {
  if (requiredPlan === "plus") return "/checkout?plan=plus";
  if (requiredPlan === "pro") return "/checkout?plan=pro";
  return "/checkout";
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function shouldShowBadge(currentPlan: UserPlan, requiredPlan?: PlanGate) {
  if (!requiredPlan) return false;
  if (requiredPlan === "pro") return currentPlan !== "pro" && currentPlan !== "plus";
  return currentPlan !== "plus";
}

function getItemDescription(label: string) {
  const map: Record<string, string> = {
    "Radar ML": "Descubra produtos com boa procura e menor concorrência.",
    "Catálogos de fornecedor": "Leia catálogos e encontre oportunidades.",
    "Estratégias ML": "Acesse estratégias práticas para vender melhor.",
    "Diagnóstico de lucro": "Veja onde sua operação perde margem.",
    "Lucro real e DRE": "Analise o resultado real da operação.",
    "Fluxo de caixa": "Entenda entradas, saídas e fôlego financeiro.",
    "Full vs Flex": "Compare cenários logísticos antes de decidir.",
    "Simulador de compra": "Teste antes de investir em estoque.",
    "Gerador de kits": "Monte combinações para elevar ticket médio.",
    "Inteligência de mercado": "Receba apoio para priorizar suas ações.",
    "Ajuda para seller": "Veja por onde começar no sistema.",
    "Planos e upgrade": "Compare os recursos disponíveis.",
    "Integrações ML": "Conecte sua conta do Mercado Livre.",
  };

  return map[label] ?? "Abrir módulo";
}

function getUpgradeCopy(label: string, plan: PlanGate) {
  const map: Record<string, { title: string; description: string }> = {
    "Radar ML": {
      title: "Descubra produtos promissores antes de investir.",
      description:
        "O Radar ML ajuda você a encontrar oportunidades com mais clareza, reduzindo decisões no escuro.",
    },
    "Catálogos de fornecedor": {
      title: "Leia catálogos com foco em oportunidade real.",
      description:
        "Transforme catálogos longos em análise prática para encontrar itens com potencial de venda.",
    },
    "Estratégias ML": {
      title: "Acesse estratégias premium para vender melhor.",
      description:
        "Veja caminhos mais práticos para anunciar, posicionar e crescer com mais inteligência.",
    },
    "Diagnóstico de lucro": {
      title: "Veja rapidamente onde sua margem está vazando.",
      description:
        "Descubra gargalos financeiros antes que eles virem prejuízo silencioso.",
    },
    "Lucro real e DRE": {
      title: "Tenha visão real do resultado da operação.",
      description:
        "Analise taxas, custos e lucro de forma mais clara antes de decidir seus próximos passos.",
    },
    "Fluxo de caixa": {
      title: "Organize entradas e saídas com mais controle.",
      description:
        "Entenda seu fôlego financeiro para comprar, anunciar e crescer sem apertos.",
    },
    "Full vs Flex": {
      title: "Compare cenários logísticos antes de agir.",
      description:
        "Tome decisões melhores analisando impacto de logística na sua operação.",
    },
    "Simulador de compra": {
      title: "Teste a compra antes de colocar dinheiro no estoque.",
      description:
        "Avalie risco, retorno e capital necessário para decidir com mais segurança.",
    },
    "Gerador de kits": {
      title: "Monte kits para melhorar ticket e giro.",
      description:
        "Use combinações inteligentes para vender melhor e aumentar valor por pedido.",
    },
    "Inteligência de mercado": {
      title: "Receba apoio para priorizar ações com mais visão.",
      description:
        "Entenda o que merece sua atenção primeiro e evite decisões aleatórias.",
    },
    "Integrações ML": {
      title: "Conecte sua conta e destrave mais automação.",
      description:
        "A integração amplia o potencial da plataforma e dá mais contexto para suas decisões.",
    },
  };

  return (
    map[label] ?? {
      title: `Desbloqueie este recurso no plano ${plan.toUpperCase()}.`,
      description: "Faça upgrade para liberar esta funcionalidade premium.",
    }
  );
}

export default function SidebarNavClient({
  modules,
  currentPlan,
}: {
  modules: SidebarModule[];
  currentPlan: UserPlan;
}) {
  const pathname = usePathname();

  const [modalState, setModalState] = useState<{
    open: boolean;
    plan: PlanGate;
    title: string;
    description: string;
    feature: string;
  }>({
    open: false,
    plan: "pro",
    title: "",
    description: "",
    feature: "",
  });

  const closeModal = () =>
    setModalState((prev) => ({
      ...prev,
      open: false,
    }));

  const dashboardActive = useMemo(
    () => isActive(pathname, "/dashboard"),
    [pathname]
  );

  return (
    <>
      <div className="sidebar-nav-modular">
        <Link
          href="/dashboard"
          className={["sidebar-link-main", dashboardActive ? "is-active" : ""].join(" ")}
        >
          <div className="sidebar-link-main-icon">
            <LayoutDashboard size={18} />
          </div>

          <div className="sidebar-link-main-copy">
            <div className="sidebar-link-main-title">Painel principal</div>
            <div className="sidebar-link-main-subtitle">
              Resumo rápido e próximos passos
            </div>
          </div>

          <BarChart3 size={16} className="sidebar-link-main-trailing" />
        </Link>

        <div className="sidebar-module-list">
          {modules.map((module) => {
            const Icon = iconMap[module.icon] ?? FolderOpen;
            const hasActiveChild = module.items.some((item) =>
              isActive(pathname, item.href)
            );

            return (
              <details
                key={module.title}
                open={hasActiveChild || module.defaultOpen}
                className="sidebar-module-card"
              >
                <summary className="sidebar-module-summary">
                  <div className="sidebar-module-icon">
                    <Icon size={18} />
                  </div>

                  <div className="sidebar-module-copy">
                    <div className="sidebar-module-title">{module.title}</div>
                    <div className="sidebar-module-subtitle">Pasta do módulo</div>
                  </div>

                  <ChevronRight size={16} className="sidebar-module-chevron" />
                </summary>

                <div className="sidebar-module-items">
                  {module.items.map((item) => {
                    const allowed = canAccess(currentPlan, item.requiredPlan);
                    const active = allowed && isActive(pathname, item.href);
                    const showBadge = shouldShowBadge(currentPlan, item.requiredPlan);
                    const description = item.description ?? getItemDescription(item.label);

                    if (!allowed && item.requiredPlan) {
                      const copy = getUpgradeCopy(item.label, item.requiredPlan);

                      return (
                        <button
                          key={item.href}
                          type="button"
                          className={[
                            "sidebar-item-link",
                            "is-locked",
                          ].join(" ")}
                          onClick={() =>
                            setModalState({
                              open: true,
                              plan: item.requiredPlan!,
                              title: copy.title,
                              description: copy.description,
                              feature: item.label,
                            })
                          }
                          style={{
                            width: "100%",
                            textAlign: "left",
                            background: "transparent",
                            cursor: "pointer",
                          }}
                        >
                          <div>
                            <div className="sidebar-item-label">{item.label}</div>
                            <div className="sidebar-item-desc">{description}</div>
                          </div>

                          <div className="sidebar-item-side">
                            {showBadge ? (
                              <span
                                className={`sidebar-item-badge ${
                                  item.requiredPlan === "plus" ? "is-plus" : "is-pro"
                                }`}
                              >
                                {item.requiredPlan.toUpperCase()}
                              </span>
                            ) : (
                              <Lock size={14} />
                            )}
                            <ChevronRight size={14} />
                          </div>
                        </button>
                      );
                    }

                    return (
                      <Link
                        key={item.href}
                        href={allowed ? item.href : getUpgradeLink(item.requiredPlan)}
                        className={[
                          "sidebar-item-link",
                          active ? "is-active" : "",
                        ].join(" ")}
                      >
                        <div>
                          <div className="sidebar-item-label">{item.label}</div>
                          <div className="sidebar-item-desc">{description}</div>
                        </div>

                        <div className="sidebar-item-side">
                          <ChevronRight size={14} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      </div>

      <UpgradeModal
        open={modalState.open}
        onClose={closeModal}
        plan={modalState.plan}
        title={modalState.title}
        description={modalState.description}
        feature={modalState.feature}
      />
    </>
  );
}
