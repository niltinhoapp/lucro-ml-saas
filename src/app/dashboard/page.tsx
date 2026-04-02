import Link from "next/link";
import { createServerClient } from "@/integrations/supabase/server";
import { getEntitlements } from "@/integrations/supabase/entitlements";
import {
  getPlanLabel,
  canAccess,
  type UserPlan,
} from "@/features/dashboard/shared/dashboard-data";
import {
  Crown,
  ArrowRight,
  ShoppingBag,
  Wallet,
  Boxes,
  Settings2,
} from "lucide-react";

function HubCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: any;
}) {
  return (
    <Link href={href} className="hub-card">
      <div className="hub-card-icon">
        <Icon size={20} />
      </div>

      <div className="hub-card-copy">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="hub-card-cta">
        <span>Acessar</span>
        <ArrowRight size={16} />
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentPlan: UserPlan = "preview";

  if (user) {
    const ent = await getEntitlements(supabase, user.id);
    currentPlan = ent.plan as UserPlan;
  }

  return (
    <div className="page hub-root">
      {/* HEADER */}
      <section className="hub-header">
        <div className="hub-badge">
          <Crown size={14} />
          {getPlanLabel(currentPlan)}
        </div>

        <h1>O que você quer analisar agora?</h1>

        <p>
          Escolha a etapa da sua operação e avance com mais clareza.
        </p>
      </section>

      {/* AÇÃO PRINCIPAL */}
      <section className="hub-main-action">
        <div className="hub-main-card">
          <h2>Comece pelo lucro</h2>

          <p>
            Antes de comprar ou escalar, valide se o produto realmente deixa margem.
          </p>

          <Link
            href="/dashboard/lucro/diagnostico"
            className="btn btn-primary"
          >
            Analisar lucro agora
          </Link>
        </div>
      </section>

      {/* NAVEGAÇÃO */}
      <section className="hub-grid">
        <HubCard
          title="Produtos"
          description="Radar, Catálogos e Estratégias para encontrar oportunidades."
          href="/dashboard/produtos"
          icon={ShoppingBag}
        />

        <HubCard
          title="Lucro"
          description="Diagnóstico, DRE e fluxo de caixa da operação."
          href="/dashboard/lucro"
          icon={Wallet}
        />

        <HubCard
          title="Operação"
          description="Simulação, kits e decisões antes da compra."
          href="/dashboard/operacao"
          icon={Boxes}
        />

        <HubCard
          title="Conta"
          description="Integrações, ajuda e configurações da conta."
          href="/dashboard/conta"
          icon={Settings2}
        />
      </section>
    </div>
  );
}