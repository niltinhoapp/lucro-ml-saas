import Link from "next/link";

export default function ProUpgradeButton({
  title = "Libere mais recursos",
  subtitle = "Faça upgrade para continuar.",
  href = "/checkout?plan=pro",
}: {
  title?: string;
  subtitle?: string;
  href?: string;
}) {
  return (
    <div className="pro-upgrade-box card card-premium">
      <div>
        <span className="badge pro">PRO</span>
        <h3>{title}</h3>
        <p className="muted" style={{ marginTop: 6 }}>
          {subtitle}
        </p>
      </div>

      <div className="pro-upgrade-actions">
        <Link href={href} className="btn btn-primary">
          Fazer upgrade
        </Link>

        <Link href="/dashboard" className="btn btn-ghost">
          Voltar
        </Link>
      </div>
    </div>
  );
}