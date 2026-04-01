import Link from "next/link";

export default function PlanUpgradeCard({
  badge = "PLUS",
  title,
  subtitle,
  href = "/checkout",
}: {
  badge?: string;
  title: string;
  subtitle: string;
  href?: string;
}) {
  return (
    <div className="pro-upgrade-box card card-premium">
      <div>
        <span className="badge pro">{badge}</span>
        <h3>{title}</h3>
        <p className="muted" style={{ marginTop: 6 }}>{subtitle}</p>
      </div>

      <div className="pro-upgrade-actions">
        <Link href={href} className="btn btn-primary">
          Ver planos
        </Link>
        <Link href="/dashboard" className="btn btn-ghost">
          Voltar ao painel
        </Link>
      </div>
    </div>
  );
}

