"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export default function CheckoutPageClient({
  mpStatus,
}: {
  mpStatus?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const mpMessage = useMemo(() => {
    if (mpStatus === "success") {
      return {
        type: "success" as const,
        text: "Pagamento iniciado com sucesso. Aguarde a confirmação da assinatura.",
      };
    }

    if (mpStatus === "pending") {
      return {
        type: "info" as const,
        text: "Seu pagamento está pendente de confirmação pelo Mercado Pago.",
      };
    }

    if (mpStatus === "failure") {
      return {
        type: "danger" as const,
        text: "O pagamento não foi concluído. Tente novamente.",
      };
    }

    return null;
  }, [mpStatus]);

  async function assinarPro() {
    try {
      setErr(null);
      setLoading(true);

      const res = await fetch("/api/mp/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: "pro_month",
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/auth/login?next=/checkout";
          return;
        }

        setErr(json?.error ?? "Erro ao iniciar assinatura.");
        return;
      }

      if (!json?.init_point) {
        setErr("Mercado Pago não retornou o link de pagamento.");
        return;
      }

      window.location.href = json.init_point;
    } catch {
      setErr("Falha ao conectar com o checkout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrap checkout-page">
      <section className="topbar checkout-hero checkout-hero-clean">
        <div className="checkout-hero-left">
          <span className="badge pro">💳 PLANO PRO</span>

          <h2 className="checkout-title">
            Pare de “achar” sua margem. Veja o lucro real por produto em minutos.
          </h2>

          <p className="subtitle checkout-subtitle">
            O PRO mostra onde você ganha, onde você perde e qual envio (FULL/FLEX) dá mais lucro.
            Ideal pra decidir preço, frete e promoções no Mercado Livre sem chute.
          </p>

          <div className="checkout-proof">
            <span className="pill good">✅ Relatórios ilimitados</span>
            <span className="pill">📄 Exportação PDF</span>
            <span className="pill">🎯 Insights automáticos</span>
          </div>
        </div>
      </section>

      <section className="checkout-grid" aria-label="Planos">
        <article className="card checkout-plan">
          <div className="checkout-plan-head">
            <span className="badge">FREE</span>
            <h3 className="checkout-plan-title">Essencial</h3>
            <p className="checkout-plan-desc">Pra testar e entender seu cenário básico.</p>
          </div>

          <div className="checkout-price">
            <span className="checkout-price-main">R$ 0</span>
            <span className="checkout-price-sub">/mês</span>
          </div>

          <ul className="checkout-list">
            <li>Painel básico</li>
            <li>DRE simples</li>
            <li>Fluxo de caixa simples</li>
            <li>Full vs Flex (limitado)</li>
          </ul>

          <div className="checkout-cta">
            <Link href="/dashboard" className="btn btn-ghost">
              Continuar no free
            </Link>
          </div>
        </article>

        <article className="card checkout-plan checkout-plan-pro">
          <div className="checkout-plan-head">
            <span className="badge pro">PRO • Recomendado</span>
            <h3 className="checkout-plan-title">Premium</h3>
            <p className="checkout-plan-desc">
              Pra escalar com clareza: margem, lucro e decisão.
            </p>
          </div>

          <div className="checkout-price">
            <span className="checkout-price-main">R$ 29,90</span>
            <span className="checkout-price-sub">/mês</span>
          </div>

          <ul className="checkout-list checkout-list-strong">
            <li><strong>DRE completo</strong> (taxas, logística, CMV e lucro)</li>
            <li><strong>Histórico ilimitado</strong> (comparar meses/produtos)</li>
            <li><strong>Exportação PDF</strong> (reunião, sócio, contador)</li>
            <li><strong>Insights automáticos</strong> (margem baixa/negativa)</li>
            <li><strong>Full vs Flex completo</strong> (recomendação)</li>
          </ul>

          <div className="checkout-cta checkout-cta-pro">
            <button
              className="btn btn-primary"
              type="button"
              onClick={assinarPro}
              disabled={loading}
            >
              {loading ? "Abrindo checkout..." : "Assinar PRO"}
            </button>

            <Link href="/dashboard" className="btn btn-ghost">
              Ver painel
            </Link>
          </div>

          {err ? (
            <div className="alert danger checkout-note">{err}</div>
          ) : mpMessage ? (
            <div className={`alert ${mpMessage.type} checkout-note`}>
              {mpMessage.text}
            </div>
          ) : (
            <div className="alert info checkout-note">
              🔒 Você será redirecionado ao Mercado Pago para concluir a assinatura.
            </div>
          )}
        </article>
      </section>

      <section className="card checkout-faq">
        <h3 className="checkout-faq-title">Perguntas rápidas</h3>

        <div className="checkout-faq-grid">
          <details>
            <summary>O que entra no DRE completo?</summary>
            <pre>
Receita, comissões, fretes, logística, CMV, impostos, despesas operacionais e lucro.
(Com alertas e comparativos no histórico.)
            </pre>
          </details>

          <details>
            <summary>Vou conseguir exportar relatórios?</summary>
            <pre>
No PRO: PDF. Ideal para reunião, sócio e tomada de decisão rápida.
            </pre>
          </details>

          <details>
            <summary>Vale a pena se eu vendo pouco?</summary>
            <pre>
Sim, porque você para de vender no escuro: identifica onde está perdendo e ajusta preço/logística.
            </pre>
          </details>
        </div>
      </section>

      <div className="alert success checkout-bottom">
        ✅ O PRO se paga quando você evita 1 produto com margem errada.
      </div>
    </div>
  );
}