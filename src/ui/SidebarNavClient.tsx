"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  FolderOpen,
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
};

export type SidebarModule = {
  title: string;
  icon: "produtos" | "lucro" | "operacao" | "conta";
  items: SidebarItem[];
};

const iconMap = {
  produtos: ShoppingBag,
  lucro: CircleDollarSign,
  operacao: Boxes,
  conta: Wallet,
} as const;

function canAccess(plan: UserPlan, requiredPlan?: PlanGate) {
  if (!requiredPlan) return true;
  if (plan === "plus") return true;
  if (plan === "pro") return requiredPlan === "pro";
  return false;
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function shouldShowBadge(currentPlan: UserPlan, requiredPlan?: PlanGate) {
  if (!requiredPlan) return false;
  if (requiredPlan === "pro") {
    return currentPlan !== "pro" && currentPlan !== "plus";
  }
  return currentPlan !== "plus";
}

function getUpgradeCopy(label: string, plan: PlanGate) {
  const map: Record<string, { title: string; description: string }> = {
    "Radar ML": {
      title: "Desbloqueie o Radar ML",
      description:
        "Descubra produtos com mais potencial antes de investir em estoque.",
    },
    Catálogos: {
      title: "Desbloqueie Catálogos",
      description:
        "Leia catálogos com foco em oportunidade real e produtos promissores.",
    },
    Estratégias: {
      title: "Desbloqueie Estratégias",
      description:
        "Acesse estratégias premium para vender melhor no Mercado Livre.",
    },
    Diagnóstico: {
      title: "Desbloqueie Diagnóstico",
      description:
        "Veja rapidamente onde sua margem está vazando e aja com mais segurança.",
    },
    DRE: {
      title: "Desbloqueie DRE",
      description: "Tenha visão mais clara do resultado real da operação.",
    },
    "Fluxo de caixa": {
      title: "Desbloqueie Fluxo de caixa",
      description:
        "Organize entradas e saídas para operar com mais controle.",
    },
    "Full vs Flex": {
      title: "Desbloqueie Full vs Flex",
      description: "Compare cenários logísticos antes de decidir.",
    },
    Simulador: {
      title: "Desbloqueie Simulador",
      description:
        "Teste a compra antes de colocar dinheiro em estoque.",
    },
    Kits: {
      title: "Desbloqueie Kits",
      description: "Monte combinações para melhorar ticket e giro.",
    },
    Inteligência: {
      title: "Desbloqueie Inteligência",
      description: "Receba apoio para priorizar ações com mais visão.",
    },
    "Integrações ML": {
      title: "Desbloqueie Integrações ML",
      description: "Conecte sua conta e amplie o potencial da plataforma.",
    },
  };

  return (
    map[label] ?? {
      title: `Desbloqueie este recurso no plano ${plan.toUpperCase()}.`,
      description: "Faça upgrade para liberar esta funcionalidade.",
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
      <nav className="sidebar-nav-modular" aria-label="Navegação do dashboard">
        <Link
          href="/dashboard"
          className={["sidebar-link-main", dashboardActive ? "is-active" : ""].join(" ")}
        >
          <div className="sidebar-link-main-icon" aria-hidden="true">
            <LayoutDashboard size={18} />
          </div>

          <div className="sidebar-link-main-copy">
            <div className="sidebar-link-main-title">Painel</div>
            <div className="sidebar-link-main-subtitle">
              Resumo rápido da operação
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
                open={hasActiveChild}
                className="sidebar-module-card"
              >
                <summary className="sidebar-module-summary">
                  <div className="sidebar-module-icon" aria-hidden="true">
                    <Icon size={18} />
                  </div>

                  <div className="sidebar-module-copy">
                    <div className="sidebar-module-title">{module.title}</div>
                  </div>

                  <ChevronRight size={16} className="sidebar-module-chevron" />
                </summary>

                <div className="sidebar-module-items">
                  {module.items.map((item) => {
                    const allowed = canAccess(currentPlan, item.requiredPlan);
                    const active = allowed && isActive(pathname, item.href);
                    const showBadge = shouldShowBadge(
                      currentPlan,
                      item.requiredPlan
                    );

                    if (!allowed && item.requiredPlan) {
                      const copy = getUpgradeCopy(item.label, item.requiredPlan);

                      return (
                        <button
                          key={item.href}
                          type="button"
                          className={[
                            "sidebar-sub-link",
                            "is-locked",
                            active ? "is-active" : "",
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
                        >
                          <span className="sidebar-item-label">{item.label}</span>

                          <div className="sidebar-sub-link-side">
                            {showBadge && (
                              <span
                                className={[
                                  "sidebar-item-badge",
                                  item.requiredPlan === "plus"
                                    ? "is-plus"
                                    : "is-pro",
                                ].join(" ")}
                              >
                                {item.requiredPlan.toUpperCase()}
                              </span>
                            )}
                            <Lock size={14} />
                          </div>
                        </button>
                      );
                    }

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={[
                          "sidebar-sub-link",
                          active ? "is-active" : "",
                        ].join(" ")}
                      >
                        <span className="sidebar-item-label">{item.label}</span>

                        {showBadge && (
                          <span
                            className={[
                              "sidebar-item-badge",
                              item.requiredPlan === "plus"
                                ? "is-plus"
                                : "is-pro",
                            ].join(" ")}
                          >
                            {item.requiredPlan?.toUpperCase()}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      </nav>

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