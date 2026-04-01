"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/integrations/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function sendMagicLink() {
    setErr(null);
    setLoading(true);

    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabaseBrowser.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    setSent(true);
  }

  return (
    <div className="page-wrap">
      <div className="card card-premium" style={{ maxWidth: 520, margin: "0 auto" }}>
        <h2>Entrar</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          Enviaremos um link para seu e-mail.
        </p>

        {sent ? (
          <div className="alert success" style={{ marginTop: 14 }}>
            Link enviado. Abra seu e-mail para entrar.
          </div>
        ) : (
          <>
            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              <label className="muted" style={{ fontWeight: 900 }}>
                E-mail
              </label>

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                className="input"
                inputMode="email"
                autoComplete="email"
              />

              {err && <div className="alert warn">{err}</div>}

              <button
                className="btn btn-primary"
                onClick={sendMagicLink}
                disabled={loading || !email}
              >
                {loading ? "Enviando..." : "Enviar link"}
              </button>
            </div>

            <div className="muted" style={{ marginTop: 12, fontSize: 13, fontWeight: 900 }}>
              Entre pelo link enviado no e-mail.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

