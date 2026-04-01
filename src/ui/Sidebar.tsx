import Link from "next/link";
import { logoutAction } from "@/app/(public)/auth/logout/actions";
import { createServerClient } from "@/supabase/server";
import { normalizeProfilePlan } from "@/lib/plans";
import SidebarNavClient, {
  type SidebarModule,
  type UserPlan,
} from "@/ui/SidebarNavClient";
import { Crown, Sparkles, Gem } from "lucide-react";

const modules: SidebarModule[] = [
  {
    title: "Produtos",
    icon: "produtos",
    defaultOpen: true,
    items: [
      {
        label: "Radar ML",
        href: "/dashboard/radar",
        requiredPlan: "plus",
        description: "Descubra produtos com boa procura e menor concorrência.",
      },
      {
        label: "Catálogos de fornecedor",
        href: "/dashboard/catalogos",
        requiredPlan: "plus",
        description: "Leia catálogos e descubra produtos com potencial.",
      },
      {
        label: "Estratégias ML",
        href: "/dashboard/estrategias",
        requiredPlan: "plus",
        description: "Acesse estratégias práticas para vender melhor.",
      },
    ],
  },
  {
    title: "Lucro",
    icon: "lucro",
    defaultOpen: true,
    items: [
      {
        label: "Diagnóstico de lucro",
        href: "/dashboard/diagnostico",
        requiredPlan: "pro",
        description: "Veja rapidamente onde sua operação perde margem.",
      },
      {
        label: "Lucro real e DRE",
        href: "/dashboard/dre",
        requiredPlan: "pro",
        description: "Organize taxas, custos e resultado final do negócio.",
      },
      {
        label: "Fluxo de caixa",
        href: "/dashboard/fluxo-caixa",
        requiredPlan: "pro",
        description: "Acompanhe entradas, saídas e fôlego financeiro.",
      },
      {
        label: "Full vs Flex",
        href: "/dashboard/full-vs-flex",
        requiredPlan: "pro",
        description: "Compare cenários logísticos e escolha melhor.",
      },
    ],
  },
  {
    title: "Operação",
    icon: "operacao",
    items: [
      {
        label: "Simulador de compra",
        href: "/dashboard/simulador",
        requiredPlan: "pro",
        description: "Avalie risco, retorno e capital antes de comprar.",
      },
      {
        label: "Gerador de kits",
        href: "/dashboard/kits",
        requiredPlan: "pro",
        description: "Monte combinações para elevar ticket e giro.",
      },
      {
        label: "Inteligência de mercado",
        href: "/dashboard/inteligencia",
        requiredPlan: "pro",
        description: "Receba apoio para decidir o que priorizar.",
      },
    ],
  },
  {
    title: "Estratégia",
    icon: "estrategia",
    items: [
      {
        label: "Ajuda para seller",
        href: "/dashboard/ajuda",
        description: "Veja por onde começar e como usar os módulos.",
      },
      {
        label: "Planos e upgrade",
        href: "/checkout",
        description: "Compare recursos e desbloqueie novos módulos.",
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
        description: "Conecte sua conta do Mercado Livre e veja o status.",
      },
      {
        label: "Voltar para o site",
        href: "/",
        description: "Retorne para a página principal do Lucro ML.",
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
  if (plan === "free") return "FREE TRIAL";
  return "PREVIEW";
}

function getPlanMessage(plan: UserPlan) {
  if (plan === "plus") {
    return "Você está no plano mais completo.";
  }

  if (plan === "pro") {
    return "Seu plano já cobre lucro e operação.";
  }

  if (plan === "free") {
    return "Ative mais módulos para decidir com mais segurança.";
  }

  return "Explore o sistema e desbloqueie recursos premium.";
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
      <div className="sidebar-card">
        <div className="sidebar-brand-top">
          <div>
           <div className="sidebar-link-main-icon" style={{ marginBottom: 12 }}>
  <Sparkles size={18} />
</div>

            <h2 className="sidebar-brand-title">Lucro ML</h2>
            <p className="sidebar-brand-subtitle">
              Layout modular para seller do Mercado Livre
            </p>
          </div>

          <span className="sidebar-plan-chip">
            <Crown size={12} style={{ marginRight: 6 }} />
            {getPlanLabel(currentPlan)}
          </span>
        </div>

        <div className="sidebar-brand-grid">
          <div className="sidebar-mini-stat">
            <div className="sidebar-mini-label">Estrutura</div>
            <div className="sidebar-mini-value">Menu por módulos</div>
          </div>

          <div className="sidebar-mini-stat">
            <div className="sidebar-mini-label">Planos</div>
            <div className="sidebar-mini-value">Free Trial, Pro e Plus</div>
          </div>
        </div>
      </div>

      <SidebarNavClient modules={modules} currentPlan={currentPlan} />

      <div className="sidebar-clean-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 10,
          }}
        >
          <div>
            <div className="sidebar-clean-title">Plano atual</div>
            <p className="sidebar-clean-text" style={{ marginTop: 6 }}>
              {getPlanMessage(currentPlan)}
            </p>
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              minHeight: 28,
              padding: "0 10px",
              borderRadius: 999,
              border: "1px solid rgba(46,204,113,.20)",
              background: "rgba(46,204,113,.10)",
              fontSize: 11,
              fontWeight: 800,
              color: "var(--text)",
            }}
          >
            <Gem size={13} />
            {getPlanLabel(currentPlan)}
          </span>
        </div>

        <div className="sidebar-session-actions">
          <Link href="/dashboard/conta" className="sidebar-secondary-btn">
            Conta
          </Link>

          <Link href="/checkout" className="sidebar-secondary-btn">
            Planos e upgrade
          </Link>

          <form action={logoutAction}>
            <button type="submit" className="sidebar-danger-btn">
              Encerrar sessão
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}