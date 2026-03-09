import Link from "next/link";
import { loginAction } from "./actions";

type Props = {
  searchParams?: Promise<{ next?: string; error?: string }>;
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

  return (
    <main className="auth-shell">
      <div className="auth-wrap">
        <section className="auth-panel">
          <div className="auth-eyebrow">Lucro ML • Sellers Mercado Livre</div>

          <h1 className="auth-title">Veja o lucro real de cada decisão.</h1>

          <p className="auth-subtitle">
            Um painel claro para sellers que precisam entender margem, DRE, fluxo de caixa
            e oportunidades de ganho sem achismo.
          </p>

          <div className="auth-grid">
            <div className="auth-stat">
              <div className="auth-stat-value">+ clareza</div>
              <div className="auth-stat-label">DRE e histórico centralizados</div>
            </div>

            <div className="auth-stat">
              <div className="auth-stat-value">+ margem</div>
              <div className="auth-stat-label">Insights para preço, frete e Full vs Flex</div>
            </div>

            <div className="auth-stat">
              <div className="auth-stat-value">1 clique</div>
              <div className="auth-stat-label">Upload da planilha e leitura imediata</div>
            </div>

            <div className="auth-stat">
              <div className="auth-stat-value">PDF</div>
              <div className="auth-stat-label">Relatórios prontos para decisão e reunião</div>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card-head">
            <span className="badge pro">Entrar</span>
            <h2 className="auth-card-title">Acesse seu painel</h2>
            <p className="auth-card-subtitle">
              Entre com seu e-mail para continuar de onde parou.
            </p>
          </div>

          {error ? <div className="alert danger">{error}</div> : null}

          <form action={loginAction} className={`auth-form ${error ? "has-error" : ""}`}>
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
                placeholder="Sua senha"
              />
              <div className="auth-help">
                Use as mesmas credenciais configuradas no Supabase Auth.
              </div>
            </div>

            <div className="auth-actions">
              <button className="btn-primary" type="submit">
                Entrar no Lucro ML
              </button>

              <Link className="btn-ghost" href={`/checkout`}>
                Ver plano PRO
              </Link>
            </div>
          </form>

          <div className="auth-footer">
            Não tem conta?{" "}
            <Link href={`/auth/register?next=${encodeURIComponent(next)}`}>
              Criar conta
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}