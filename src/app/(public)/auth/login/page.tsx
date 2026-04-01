import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/integrations/supabase/server";
import AuthGoogleButton from "@/components/auth/AuthGoogleButton";
import { loginAction } from "./actions";

type Props = {
  searchParams: Promise<{
    error?: string;
    next?: string;
    success?: string;
  }>;
};

function safeNext(next?: string | null) {
  if (!next) return "/dashboard";
  if (!next.startsWith("/")) return "/dashboard";
  if (next.startsWith("//")) return "/dashboard";
  return next;
}

export default async function LoginPage(props: Props) {
  const sp = await props.searchParams;
  const next = safeNext(sp.next);
  const error = sp.error ? decodeURIComponent(sp.error) : "";
  const success = sp.success ? decodeURIComponent(sp.success) : "";

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect(next);

  return (
    <div className="auth-shell">
      <div className="auth-wrap auth-wrap-single">
        <section className="auth-card">
          <div className="auth-card-head auth-card-head-centered">
            <span className="auth-eyebrow">Lucro ML</span>
           
            <p className="auth-card-subtitle">
              Use Google ou entre com e-mail e senha para acessar seu painel.
            </p>
          </div>

          {error ? <div className="alert danger">{error}</div> : null}
          {success ? <div className="alert success">{success}</div> : null}

          <div className="auth-social-stack">
            <AuthGoogleButton next={next} mode="login" />
          </div>

          <div className="auth-divider">
            <span>ou entre com e-mail e senha</span>
          </div>

          <form action={loginAction} className="auth-form">
            <input type="hidden" name="next" value={next} />

            <div>
              <label className="auth-label">E-mail</label>
              <input
                className="auth-input"
                type="email"
                name="email"
                placeholder="seuemail@exemplo.com"
                required
              />
            </div>

            <div>
              <label className="auth-label">Senha</label>
              <input
                className="auth-input"
                type="password"
                name="password"
                placeholder="Sua senha"
                required
              />
            </div>

            <div className="auth-inline-links">
              <Link href="/auth/esqueci-senha" className="auth-link">
                Esqueci minha senha
              </Link>
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Entrar
            </button>
          </form>

          <div className="auth-footer">
            Ainda não tem conta?{" "}
            <Link href={`/auth/register?next=${encodeURIComponent(next)}`}>
              Criar conta
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}




