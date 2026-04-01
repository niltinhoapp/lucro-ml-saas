import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { createServerClient } from "@/integrations/supabase/server";
import { getPlanSpec, normalizeProfilePlan } from "@/lib/plans";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function statusMessage(value: string | undefined) {
  switch (value) {
    case "connected":
      return {
        tone: "success",
        text: "Sua conta do Mercado Livre foi conectada com sucesso.",
      };
    case "state_error":
      return {
        tone: "error",
        text: "Não conseguimos validar a conexão. Tente novamente.",
      };
    case "token_error":
      return {
        tone: "error",
        text: "Não foi possível concluir a conexão com o Mercado Livre.",
      };
    case "db_error":
      return {
        tone: "error",
        text: "A conta foi autorizada, mas ocorreu um erro ao finalizar a conexão.",
      };
    case "login_required":
      return {
        tone: "error",
        text: "Faça login no LucroML antes de conectar sua conta.",
      };
    case "profile_error":
      return {
        tone: "error",
        text: "Não foi possível validar seu plano no LucroML.",
      };
    case "plan_upgrade_required":
      return {
        tone: "error",
        text: "A conexão com o Mercado Livre está disponível apenas no plano Plus.",
      };
    default:
      return null;
  }
}

function getPlanLabel(label: string) {
  if (label.toLowerCase().includes("free")) return "FREE";
  return label.toUpperCase();
}

export default async function ContaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentPlan = "FREE";
  let canConnectMl = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();

    const normalizedPlan = normalizeProfilePlan(profile?.plan);
    const planSpec = getPlanSpec(normalizedPlan);

    currentPlan = getPlanLabel(planSpec.label);
    canConnectMl = planSpec.canUseMlConnection;
  }

  const { data: connection } = user
    ? await supabase
        .from("ml_connections")
        .select("ml_nickname, expires_at, updated_at, is_active")
        .eq("user_id", user.id)
        .maybeSingle<{
          ml_nickname: string | null;
          expires_at: string | null;
          updated_at: string | null;
          is_active: boolean | null;
        }>()
    : { data: null };

  const mlParam = Array.isArray(params.ml) ? params.ml[0] : params.ml;
  const banner = statusMessage(mlParam);

  return (
    <div className="premium-page-shell account-integrations-page">
      <section className="hero-card premium-card">
        <div className="hero-copy">
          <span className="eyebrow">Conta e integrações</span>
          <h1>Conecte sua conta do Mercado Livre</h1>
          <p className="muted">
            Ao conectar sua conta, o LucroML poderá usar seus dados autorizados
            para ajudar na análise da operação, leitura de desempenho e evolução
            dos módulos premium.
          </p>
        </div>

        <div className="hero-actions">
          <span className="plan-badge">Plano atual: {currentPlan}</span>

          {canConnectMl ? (
            <a href="/api/ml/oauth/start" className="btn btn-primary">
              {connection?.is_active
                ? "Conectar novamente"
                : "Conectar Mercado Livre"}
            </a>
          ) : (
            <Link href="/checkout?plan=plus&feature=ml" className="btn btn-primary">
              Liberar no Plus
            </Link>
          )}
        </div>
      </section>

      {banner ? (
        <section
          className={`premium-card status-banner ${
            banner.tone === "success" ? "is-success" : "is-error"
          }`}
        >
          <div className="status-banner-title">Status da conexão</div>
          <p>{banner.text}</p>
        </section>
      ) : null}

      <div className="account-grid">
        <section className="premium-card account-card">
          <div className="section-title-row">
            <h2>Situação da conta</h2>
            {connection?.is_active ? (
              <span className="inline-badge success">Conectada</span>
            ) : (
              <span className="inline-badge">Não conectada</span>
            )}
          </div>

          {connection?.is_active ? (
            <div className="integration-info-list">
              <div className="integration-info-item">
                <span>Conta conectada</span>
                <strong>{connection.ml_nickname ?? "-"}</strong>
              </div>

              <div className="integration-info-item">
                <span>Validade da conexão</span>
                <strong>
                  {connection.expires_at
                    ? new Date(connection.expires_at).toLocaleString("pt-BR")
                    : "-"}
                </strong>
              </div>

              <div className="integration-info-item">
                <span>Última atualização</span>
                <strong>
                  {connection.updated_at
                    ? new Date(connection.updated_at).toLocaleString("pt-BR")
                    : "-"}
                </strong>
              </div>
            </div>
          ) : (
            <p className="muted">
              Você ainda não conectou sua conta do Mercado Livre ao LucroML.
              Quando a conexão for autorizada, o sistema salvará o vínculo com
              segurança para usar nos recursos disponíveis do seu plano.
            </p>
          )}
        </section>

        <section className="premium-card account-card">
          <div className="section-title-row">
            <h2>O que essa conexão libera</h2>
            <ShieldCheck size={18} />
          </div>

          <ul className="account-checklist">
            <li>
              <CheckCircle2 size={16} /> Mais integração entre sua conta e os
              módulos do LucroML
            </li>
            <li>
              <CheckCircle2 size={16} /> Base para leitura de desempenho e
              evolução dos recursos premium
            </li>
            <li>
              <CheckCircle2 size={16} /> Preparação para conectar dados reais ao
              Radar ML
            </li>
            <li>
              <CheckCircle2 size={16} /> Recurso disponível no plano Plus
            </li>
          </ul>
        </section>

        <section className="premium-card account-card">
          <div className="section-title-row">
            <h2>Como funciona</h2>
            <RefreshCcw size={18} />
          </div>

          <div className="route-list">
            <div className="route-item">
              <strong>1. Você autoriza</strong>
              <span>
                O LucroML abre a tela oficial do Mercado Livre para você aprovar
                a conexão.
              </span>
            </div>
            <div className="route-item">
              <strong>2. A conta é vinculada</strong>
              <span>
                Após a autorização, sua conta fica conectada ao LucroML com
                segurança.
              </span>
            </div>
            <div className="route-item">
              <strong>3. Os módulos evoluem</strong>
              <span>
                A conexão prepara o sistema para análises mais inteligentes e
                recursos premium mais fortes.
              </span>
            </div>
          </div>
        </section>

        <section className="premium-card account-card">
          <div className="section-title-row">
            <h2>Próximos recursos</h2>
            <RefreshCcw size={18} />
          </div>

          <div className="route-list">
            <div className="route-item">
              <strong>Radar ML mais forte</strong>
              <span>
                Cruzar dados reais da sua conta com oportunidades e sinais do
                mercado.
              </span>
            </div>
            <div className="route-item">
              <strong>Leitura da operação</strong>
              <span>
                Ampliar a análise do seu desempenho dentro do LucroML.
              </span>
            </div>
            <div className="route-item">
              <strong>Mais inteligência</strong>
              <span>
                Preparar a base para módulos cada vez mais úteis para seller.
              </span>
            </div>
          </div>

          <Link
            href="https://developers.mercadolivre.com.br"
            target="_blank"
            className="inline-link-external"
          >
            Saiba mais sobre a integração <ExternalLink size={14} />
          </Link>
        </section>
      </div>
    </div>
  );
}



