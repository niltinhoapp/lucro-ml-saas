import Link from "next/link";
import { logoutAction } from "@/app/(public)/auth/logout/actions";
import { createServerClient } from "@/integrations/supabase/server";
import { normalizeProfilePlan } from "@/lib/plans";
import SidebarNavClient, {
  type SidebarModule,
  type UserPlan,
} from "@/ui/SidebarNavClient";
import { Crown, Sparkles, Gem, LogOut } from "lucide-react";

const modules: SidebarModule[] = [
  {
    title: "Produtos",
    icon: "produtos",
    items: [
      {
        label: "Radar ML",
        href: "/dashboard/produtos/radar",
        requiredPlan: "plus",
      },
      {
        label: "Catálogos",
        href: "/dashboard/produtos/catalogos",
        requiredPlan: "plus",
      },
      {
        label: "Estratégias",
        href: "/dashboard/produtos/estrategias",
        requiredPlan: "plus",
      },
    ],
  },
  {
    title: "Lucro",
    icon: "lucro",
    items: [
      {
        label: "Diagnóstico",
        href: "/dashboard/lucro/diagnostico",
        requiredPlan: "pro",
      },
      {
        label: "DRE",
        href: "/dashboard/lucro/dre",
        requiredPlan: "pro",
      },
      {
        label: "Fluxo de caixa",
        href: "/dashboard/lucro/fluxo-caixa",
        requiredPlan: "pro",
      },
      {
        label: "Full vs Flex",
        href: "/dashboard/lucro/full-vs-flex",
        requiredPlan: "pro",
      },
    ],
  },
  {
    title: "Operação",
    icon: "operacao",
    items: [
      {
        label: "Simulador",
        href: "/dashboard/operacao/simulador",
        requiredPlan: "pro",
      },
      {
        label: "Kits",
        href: "/dashboard/operacao/kits",
        requiredPlan: "pro",
      },
      {
        label: "Inteligência",
        href: "/dashboard/operacao/inteligencia",
        requiredPlan: "pro",
      },
    ],
  },
  {
    title: "Conta",
    icon: "conta",
    items: [
      {
        label: "Integrações ML",
        href: "/dashboard/conta",
        requiredPlan: "plus",
      },
      {
        label: "Ajuda",
        href: "/dashboard/ajuda",
      },
      {
        label: "Planos",
        href: "/checkout",
      },
    ],
  },
];

function toSidebarPlan(plan: string | null | undefined): UserPlan {
  const normalized = normalizeProfilePlan(plan);

  if (normalized === "plus") return "plus";
  if (normalized === "pro") return "pro";
  if (normalized === "free_trial") return "free";
  return "preview";
}

function getPlanLabel(plan: UserPlan) {
  if (plan === "plus") return "PLUS";
  if (plan === "pro") return "PRO";
  if (plan === "free") return "FREE";
  return "PREVIEW";
}

function getPlanMessage(plan: UserPlan) {
  if (plan === "plus") return "Plano completo ativo.";
  if (plan === "pro") return "Lucro e operação liberados.";
  if (plan === "free") return "Desbloqueie mais módulos.";
  return "Explore os recursos disponíveis.";
}

export default async function Sidebar() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentPlan: UserPlan = "preview";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();

    currentPlan = toSidebarPlan(profile?.plan);
  }

  return (
    <aside className="sidebar-modular shrink-0">
      <div className="sidebar-card sidebar-card-brand">
        <div className="sidebar-brand-row">
          <div className="sidebar-link-main-icon" aria-hidden="true">
            <Sparkles size={18} />
          </div>

          <div className="sidebar-brand-copy">
            <h2 className="sidebar-brand-title">Lucro ML</h2>
            <p className="sidebar-brand-subtitle">Centro de decisão do seller</p>
          </div>

          <span className="sidebar-plan-chip">
            <Crown size={12} />
            {getPlanLabel(currentPlan)}
          </span>
        </div>
      </div>

      <SidebarNavClient modules={modules} currentPlan={currentPlan} />

      <div className="sidebar-clean-card">
        <div className="sidebar-clean-top">
          <div>
            <div className="sidebar-clean-title">Plano atual</div>
            <p className="sidebar-clean-text">{getPlanMessage(currentPlan)}</p>
          </div>

          <span className="sidebar-plan-mini-chip">
            <Gem size={13} />
            {getPlanLabel(currentPlan)}
          </span>
        </div>

        <div className="sidebar-session-actions">
          <Link href="/checkout" className="sidebar-secondary-btn">
            Ver planos
          </Link>

          <Link href="/" className="sidebar-secondary-btn">
            Ir para o site
          </Link>
        </div>

        <form action={logoutAction}>
          <button type="submit" className="sidebar-logout-btn">
            <LogOut size={15} />
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}