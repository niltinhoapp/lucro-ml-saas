import { logoutAction } from "@/app/(public)/auth/logout/actions";
import { createServerClient } from "@/integrations/supabase/server";
import { normalizeProfilePlan } from "@/lib/plans";
import SidebarNavClient, {
  type SidebarModule,
  type UserPlan,
} from "@/ui/SidebarNavClient";
import { LogOut } from "lucide-react";

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
        href: "/dashboard/conta/ajuda",
      },
      {
        label: "Planos",
        href: "/checkout",
      },
      {
        label: "Ir para o site",
        href: "/",
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
    <div className="lm-sidebar-v2">
      <aside className="sidebar-modular shrink-0">
        <div className="sidebar-minimal-brand">
          <span className="sidebar-minimal-brand-mark" />
          <span className="sidebar-minimal-brand-text">Lucro ML</span>
        </div>

        <SidebarNavClient modules={modules} currentPlan={currentPlan} />

        <div className="sidebar-logout-wrap">
          <form action={logoutAction}>
            <button type="submit" className="sidebar-logout-btn">
              <LogOut size={15} />
              Sair
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
