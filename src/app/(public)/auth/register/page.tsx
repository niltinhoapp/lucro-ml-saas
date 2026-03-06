import Link from "next/link";
import { registerAction } from "./actions";

type Props = {
  searchParams?: Promise<{ next?: string; error?: string; check?: string }>;
};

function safeNext(next?: string) {
  if (!next) return "/dashboard";
  if (!next.startsWith("/")) return "/dashboard";
  if (next.startsWith("//")) return "/dashboard";
  return next;
}

export default async function Page(props: Props) {
  const sp = (await props.searchParams) ?? {};
  const next = safeNext(sp.next);
  const error = sp.error ? decodeURIComponent(sp.error) : null;
  const check = sp.check === "1";

  return (
    <main className="auth-shell">
      <div className="auth-wrap">
        <section className="auth-panel">
          <div className="auth-eyebrow">Lucro ML • Cadastro</div>

          <h1 className="auth-title">Crie sua base para vender com lucro.</h1>

          <p className="auth-subtitle">
            Estruture seu painel, acompanhe relatórios e tenha um ponto único para analisar
            margem, histórico e decisões financeiras do seu negócio.
          </p>

          <div className="auth-grid">
            <div className="auth-stat">
              <div className="auth-stat-value">Setup rápido</div>
              <div className="auth-stat-label">Conta pronta em poucos segundos</div>
            </div>

            <div className="auth-stat">
              <div className="auth-stat-value">Mais controle</div>
              <div className="auth-stat-label">Indicadores financeiros em um só lugar</div>
            </div>

            <div className="auth-stat">
              <div className="auth-stat-value">Sem planilhas soltas</div>
              <div className="auth-stat-label">Histórico salvo e fácil de revisar</div>
            </div>

            <div className="auth-stat">
              <div className="auth-stat-value">Escalável</div>
              <div className="auth-stat-label">Base pronta para novas features do SaaS</div>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card-head">
            <span className="badge pro">Criar conta</span>
            <h2 className="auth-card-title">Abra seu acesso</h2>
            <p className="auth-card-subtitle">
              Cadastre-se para usar o painel e ativar seu fluxo financeiro.
            </p>
          </div>

          {check ? (
            <div className="alert success">
              Conta criada. Confirme o e-mail enviado para sua caixa de entrada e depois volte para entrar.
            </div>
          ) : null}

          {error ? (
            <div className={`alert danger ${check ? "auth-alert-gap" : ""}`}>
              {error}
            </div>
          ) : null}

          <form
            action={registerAction}
            className={`auth-form ${check || error ? "has-error" : ""}`}
          >
            <input type="hidden" name="next" value={next} />

            <div>
              <label className="auth-label">E-mail</label>
              <input
                className="auth-input"
                name="email"
                type="email"
                required
                placeholder="voce@empresa.com"
              />
            </div>

            <div>
              <label className="auth-label">Senha</label>
              <input
                className="auth-input"
                name="password"
                type="password"
                required
                placeholder="Crie uma senha"
              />
              <div className="auth-help">
                Recomendado: mínimo de 8 caracteres.
              </div>
            </div>

            <div className="auth-actions">
              <button className="btn-primary" type="submit">
                Criar conta
              </button>

              <Link className="btn-ghost" href={`/auth/login?next=${encodeURIComponent(next)}`}>
                Já tenho acesso
              </Link>
            </div>
          </form>

          <div className="auth-footer">
            Já tem conta?{" "}
            <Link href={`/auth/login?next=${encodeURIComponent(next)}`}>
              Entrar
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}