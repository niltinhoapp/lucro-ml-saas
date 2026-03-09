import Link from "next/link";
import { loginAction } from "./actions";

type Props = {
  searchParams?: Promise<{ next?: string; error?: string }>;
};

export default async function Page(props: Props) {
  const sp = (await props.searchParams) ?? {};
  const next = sp.next ?? "/dashboard";
  const error = sp.error ? decodeURIComponent(sp.error) : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow">
        <h1 className="text-xl font-semibold">Entrar</h1>
        <p className="text-sm text-gray-500 mt-1">Acesse sua conta para entrar no painel.</p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form action={loginAction} className="mt-5 space-y-3">
          <input type="hidden" name="next" value={next} />

          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Senha</label>
            <input
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="••••••••"
            />
          </div>

          <button className="w-full rounded-lg bg-black text-white py-2 font-medium">
            Entrar
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-600">
          Não tem conta?{" "}
          <Link className="underline" href={`/auth/register?next=${encodeURIComponent(next)}`}>
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}
