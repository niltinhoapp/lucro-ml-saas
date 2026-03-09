import Link from "next/link";

export default function ProUpgradeButton({
  title = "Desbloquear PRO",
  subtitle = "Mais insights, histórico e decisões práticas para vender melhor.",
  href = "/checkout",
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
        <p className="muted" style={{ marginTop: 6 }}>{subtitle}</p>
      </div>

      <div className="pro-upgrade-actions">
        <Link href={href} className="btn btn-primary">
          Assinar PRO
        </Link>
        <Link href="/dashboard" className="btn btn-ghost">
          Ver painel
        </Link>
      </div>
    </div>
  );
}
