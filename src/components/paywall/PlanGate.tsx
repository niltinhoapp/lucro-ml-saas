import type { ReactNode } from "react";
import Link from "next/link";

type Props = {
  requiredPlan: "pro" | "plus";
  title: string;
  description: string;
  bullets?: string[];
  children: ReactNode;
};

export default function PlanGate({
  requiredPlan,
  title,
  description,
  bullets = [],
  children,
}: Props) {
  return (
    <div className="page-wrap" style={{ display: "grid", gap: 18 }}>
      <section className="feature-lock card card-premium">
        <div className="feature-lock-top">
          <span className={`badge ${requiredPlan === "plus" ? "pro" : ""}`.trim()}>
            {requiredPlan.toUpperCase()}
          </span>
        </div>

        <h1>{title}</h1>

        <p className="feature-lock-copy">{description}</p>

        {bullets.length > 0 ? (
          <div className="feature-lock-bullets">
            {bullets.map((item) => (
              <div key={item} className="feature-lock-bullet">
                {item}
              </div>
            ))}
          </div>
        ) : null}

        <div className="feature-lock-actions">
          <Link href={`/checkout?plan=${requiredPlan}`} className="btn btn-primary">
            Fazer upgrade
          </Link>

          <Link href="/dashboard" className="btn btn-ghost">
            Voltar
          </Link>
        </div>
      </section>

      {children}
    </div>
  );
}

