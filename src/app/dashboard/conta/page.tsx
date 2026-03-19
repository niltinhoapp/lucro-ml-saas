import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RefreshCcw,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import { createServerClient } from "@/supabase/server";
import { getPlanSpec, normalizeProfilePlan } from "@/lib/plans";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type MlConnectionView = {
  ml_nickname: string | null;
  expires_at: string | null;
  updated_at: string | null;
  is_active: boolean | null;
};

type ConnectionStatus = "connected" | "expired" | "error" | "disconnected";
type BannerTone = "success" | "error";

type BannerMessage = {
  tone: BannerTone;
  text: string;
};

type ConnectionMeta = {
  badgeClass: string;
  badgeText: string;
  title: string;
  description: string;
};

function getFirstParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(value: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("pt-BR");
}

function getPlanLabel(label: string): string {
  if (label.toLowerCase().includes("free")) return "FREE";
  return label.toUpperCase();
}

function getBannerMessage(value: string | undefined): BannerMessage | null {
  switch (value) {
    case "connected":
      return {
        tone: "success",
        text: "Sua conta do Mercado Livre foi conectada com sucesso.",
      };
    case "disconnected":
      return {
        tone: "success",
        text: "A conta do Mercado Livre foi desconectada com sucesso.",
      };
    case "disconnect_error":
      return {
        tone: "error",
        text: "Não foi possível desconectar a conta do Mercado Livre.",
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
    case "oauth_denied":
      return {
        tone: "error",
        text: "A autorização no Mercado Livre foi cancelada ou negada.",
      };
    case "ml_profile_error":
      return {
        tone: "error",
        text: "Não foi possível validar os dados da conta do Mercado Livre.",
      };
    case "already_linked":
      return {
        tone: "error",
        text: "Esta conta do Mercado Livre já está vinculada a outro usuário.",
      };
    default:
      return null;
  }
}

function getConnectionStatus(connection: MlConnectionView | null): ConnectionStatus {
  if (!connection?.is_active) return "disconnected";
  if (!connection.expires_at) return "error";

  const expiresAt = new Date(connection.expires_at).getTime();

  if (!Number.isFinite(expiresAt)) return "error";
  if (expiresAt <= Date.now()) return "expired";

  return "connected";
}

function getConnectionMeta(status: ConnectionStatus): ConnectionMeta {
  switch (status) {
    case "connected":
      return {
        badgeClass: "success",
        badgeText: "Conectada",
        title: "Conexão ativa",
        description:
          "Sua conta do Mercado Livre está conectada e pronta para uso nos módulos compatíveis.",
      };

    case "expired":
      return {
        badgeClass: "warning",
        badgeText: "Expirada",
        title: "Sessão expirada",
        description:
          "A conexão existe, mas a sessão expirou. Reconecte a conta para voltar a usar os recursos.",
      };

    case "error":
      return {
        badgeClass: "danger",
        badgeText: "Com erro",
        title: "Erro na conexão",
        description:
          "Encontramos inconsistência nos dados da conexão. Reconecte a conta para corrigir.",
      };

    case "disconnected":
    default:
      return {
        badgeClass: "",
        badgeText: "Não conectada",
        title: "Sem conexão",
        description:
          "Você ainda não conectou sua conta do Mercado Livre ao LucroML.",
      };
  }
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
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle<MlConnectionView>()
    : { data: null as MlConnectionView | null };

  const mlParam = getFirstParamValue(params.ml);
  const banner = getBannerMessage(mlParam);

  const connectionStatus = getConnectionStatus(connection);
  const connectionMeta = getConnectionMeta(connectionStatus);

  const canReconnect =
    connectionStatus === "connected" ||
    connectionStatus === "expired" ||
    connectionStatus === "error";

  const hasSavedConnection = Boolean(connection);

  const showConnectionDetails =
    (connectionStatus === "connected" ||
      connectionStatus === "expired" ||
      connectionStatus === "error") &&
    !!connection;

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
            <div className="account-actions-row">
              <a href="/api/ml/oauth/start" className="btn btn-primary">
                {canReconnect ? "Conectar novamente" : "Conectar Mercado Livre"}
              </a>

              {hasSavedConnection ? (
                <form action="/api/ml/disconnect" method="POST" className="account-inline-form">
                  <button type="submit" className="btn btn-danger-soft account-disconnect-btn">
                    <Unplug size={16} />
                    <span>Desconectar conta</span>
                  </button>
                </form>
              ) : null}
            </div>
          ) : (
            <Link
              href="/checkout?plan=plus&feature=ml"
              className="btn btn-primary"
            >
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

      {(connectionStatus === "expired" || connectionStatus === "error") && canConnectMl ? (
        <section className="premium-card status-banner is-error">
          <div className="status-banner-title">
            {connectionStatus === "expired"
              ? "Sessão expirada"
              : "Problema na conexão"}
          </div>
          <p>{connectionMeta.description}</p>
        </section>
      ) : null}

      <div className="account-grid">
        <section className="premium-card account-card">
          <div className="section-title-row">
            <h2>Situação da conta</h2>
            <span className={`inline-badge ${connectionMeta.badgeClass}`}>
              {connectionMeta.badgeText}
            </span>
          </div>

          {showConnectionDetails ? (
            <div className="integration-info-list">
              <div className="integration-info-item">
                <span>Status da conexão</span>
                <strong>{connectionMeta.title}</strong>
              </div>

              <div className="integration-info-item">
                <span>Conta conectada</span>
                <strong>{connection?.ml_nickname ?? "-"}</strong>
              </div>

              <div className="integration-info-item">
                <span>Validade da conexão</span>
                <strong>{formatDateTime(connection?.expires_at ?? null)}</strong>
              </div>

              <div className="integration-info-item">
                <span>Última atualização</span>
                <strong>{formatDateTime(connection?.updated_at ?? null)}</strong>
              </div>
            </div>
          ) : (
            <p className="muted">
              Você ainda não conectou sua conta do Mercado Livre ao LucroML.
              Quando a conexão for autorizada, o sistema salvará o vínculo com
              segurança para usar nos recursos disponíveis do seu plano.
            </p>
          )}

          {(connectionStatus === "expired" || connectionStatus === "error") &&
          canConnectMl ? (
            <div className="account-secondary-actions">
              <a href="/api/ml/oauth/start" className="btn btn-primary">
                <RefreshCcw size={16} />
                <span>Reconectar agora</span>
              </a>
            </div>
          ) : null}
        </section>

        <section className="premium-card account-card">
          <div className="section-title-row">
            <h2>O que essa conexão libera</h2>
            <ShieldCheck size={18} />
          </div>

          <ul className="account-checklist">
            <li>
              <CheckCircle2 size={16} />
              <span>
                Mais integração entre sua conta e os módulos do LucroML
              </span>
            </li>
            <li>
              <CheckCircle2 size={16} />
              <span>
                Base para leitura de desempenho e evolução dos recursos premium
              </span>
            </li>
            <li>
              <CheckCircle2 size={16} />
              <span>
                Preparação para conectar dados reais ao Radar ML
              </span>
            </li>
            <li>
              <CheckCircle2 size={16} />
              <span>Recurso disponível no plano Plus</span>
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
            <AlertTriangle size={18} />
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
