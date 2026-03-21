import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Link2,
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

function getFirstParamValue(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

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

function getConnectionStatus(
  connection: MlConnectionView | null
): ConnectionStatus {
  if (!connection?.is_active) return "disconnected";
  if (!connection.expires_at) return "error";

  const expiresAt = new Date(connection.expires_at).getTime();

  if (!Number.isFinite(expiresAt)) return "error";
  if (expiresAt <= Date.now()) return "expired";

  return "connected";
}

function getStatusConfig(status: ConnectionStatus) {
  switch (status) {
    case "connected":
      return {
        badgeText: "Conectada",
        badgeClass: "success",
        title: "Conexão ativa",
        description:
          "Sua conta está conectada e pronta para alimentar os módulos com dados reais.",
        accentClass: "is-success",
      };

    case "expired":
      return {
        badgeText: "Expirada",
        badgeClass: "warning",
        title: "Sessão expirada",
        description:
          "A conexão existe, mas precisa ser renovada para voltar a usar os recursos.",
        accentClass: "is-warning",
      };

    case "error":
      return {
        badgeText: "Com erro",
        badgeClass: "danger",
        title: "Erro na conexão",
        description:
          "Encontramos um problema na integração. Reconecte a conta para corrigir.",
        accentClass: "is-danger",
      };

    case "disconnected":
    default:
      return {
        badgeText: "Não conectada",
        badgeClass: "",
        title: "Nenhuma conta conectada",
        description:
          "Conecte sua conta do Mercado Livre para liberar dados reais no LucroML.",
        accentClass: "",
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
  const status = getStatusConfig(connectionStatus);

  const canReconnect =
    connectionStatus === "connected" ||
    connectionStatus === "expired" ||
    connectionStatus === "error";

  const hasSavedConnection = Boolean(connection);

  return (
    <div className="premium-page-shell account-page-premium">
      <section className="premium-hero premium-card">
        <div className="premium-hero__glow premium-hero__glow--primary" />
        <div className="premium-hero__glow premium-hero__glow--secondary" />

        <div className="premium-hero__content">
          <div className="premium-hero__left">
            <span className="eyebrow">Conta</span>
            <h1>Conexão com Mercado Livre</h1>
            <p className="muted premium-hero__text">
              Conecte sua conta para usar dados reais da operação dentro do
              LucroML e preparar análises mais inteligentes nos módulos.
            </p>

            <div className="premium-hero__chips">
              <span className="plan-badge">Plano atual: {currentPlan}</span>
              <span className={`inline-badge ${status.badgeClass}`}>
                {status.badgeText}
              </span>
            </div>
          </div>

          <div className="premium-hero__right">
            {canConnectMl ? (
              <div className="premium-actions">
                <a href="/api/ml/oauth/start" className="btn btn-primary btn-lg">
                  <Link2 size={16} />
                  <span>
                    {canReconnect ? "Reconectar conta" : "Conectar Mercado Livre"}
                  </span>
                </a>

                {hasSavedConnection ? (
                  <form action="/api/ml/disconnect" method="POST">
                    <button type="submit" className="btn btn-secondary btn-lg">
                      <Unplug size={16} />
                      <span>Desconectar</span>
                    </button>
                  </form>
                ) : null}
              </div>
            ) : (
              <Link
                href="/checkout?plan=plus&feature=ml"
                className="btn btn-primary btn-lg"
              >
                Liberar no Plus
              </Link>
            )}
          </div>
        </div>
      </section>

      {banner ? (
        <section
          className={`premium-toast premium-card ${
            banner.tone === "success" ? "is-success" : "is-error"
          }`}
        >
          <div className="premium-toast__icon">
            {banner.tone === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertTriangle size={18} />
            )}
          </div>
          <div className="premium-toast__content">
            <div className="premium-toast__title">Atualização</div>
            <p>{banner.text}</p>
          </div>
        </section>
      ) : null}

      <div className="account-premium-grid">
        <section className={`premium-card premium-status-card ${status.accentClass}`}>
          <div className="section-title-row">
            <div>
              <span className="section-kicker">Status atual</span>
              <h2>{status.title}</h2>
            </div>

            <span className={`inline-badge ${status.badgeClass}`}>
              {status.badgeText}
            </span>
          </div>

          <p className="muted">{status.description}</p>

          <div className="premium-metrics">
            <div className="premium-metric">
              <span>Conta conectada</span>
              <strong>{connection?.ml_nickname ?? "—"}</strong>
            </div>

            <div className="premium-metric">
              <span>Validade</span>
              <strong>{formatDateTime(connection?.expires_at ?? null)}</strong>
            </div>

            <div className="premium-metric">
              <span>Última atualização</span>
              <strong>{formatDateTime(connection?.updated_at ?? null)}</strong>
            </div>
          </div>

          {(connectionStatus === "expired" || connectionStatus === "error") &&
          canConnectMl ? (
            <div className="premium-inline-actions">
              <a href="/api/ml/oauth/start" className="btn btn-primary">
                <RefreshCcw size={16} />
                <span>Reconectar agora</span>
              </a>
            </div>
          ) : null}
        </section>

        <section className="premium-card premium-benefits-card">
          <div className="section-title-row">
            <div>
              <span className="section-kicker">Benefícios</span>
              <h2>O que essa conexão libera</h2>
            </div>
            <ShieldCheck size={18} />
          </div>

          <ul className="premium-benefits-list">
            <li>
              <CheckCircle2 size={16} />
              <span>Uso de dados reais da conta nos módulos do LucroML</span>
            </li>
            <li>
              <CheckCircle2 size={16} />
              <span>Base para análises mais inteligentes do seller</span>
            </li>
            <li>
              <CheckCircle2 size={16} />
              <span>Preparação para cruzar seller, radar e catálogos</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}