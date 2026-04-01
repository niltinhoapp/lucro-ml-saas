import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/supabase/server";
import AuthGoogleButton from "@/components/auth/AuthGoogleButton";
import { registerAction } from "./actions";

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

export default async function RegisterPage(props: Props) {
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
      <div className="auth-wrap">
        <section className="auth-panel">
          <span className="auth-eyebrow">Teste rápido</span>
          <h1 className="auth-title">Crie sua conta e comece com segurança</h1>
          <p className="auth-subtitle">
            Em poucos minutos você acessa o sistema e começa a ver onde está o
            lucro, o alerta e o próximo passo da operação.
          </p>
        </section>

        <section className="auth-card">
          <div className="auth-card-head">
            <h2 className="auth-card-title">Criar conta</h2>
            <p className="auth-card-subtitle">
              Comece com Google ou cadastre seu acesso por e-mail.
            </p>
          </div>

          {error ? <div className="alert danger">{error}</div> : null}
          {success ? <div className="alert success">{success}</div> : null}

          <div className="auth-social-stack">
            <AuthGoogleButton next={next} mode="register" />
          </div>

          <div className="auth-divider">
            <span>ou crie com e-mail e senha</span>
          </div>

          <form action={registerAction} className="auth-form">
            <input type="hidden" name="next" value={next} />

            <div>
              <label className="auth-label">Nome</label>
              <input
                className="auth-input"
                type="text"
                name="full_name"
                placeholder="Seu nome"
                required
              />
            </div>

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
                placeholder="Crie uma senha"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Criar conta
            </button>
          </form>

          <div className="auth-footer">
            Já tem conta? <Link href={`/auth/login?next=${encodeURIComponent(next)}`}>Entrar</Link>
          </div>
        </section>
      </div>
    </div>
  );
}