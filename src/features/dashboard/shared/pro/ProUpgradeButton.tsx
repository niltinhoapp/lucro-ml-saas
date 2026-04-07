import Link from "next/link";
import { Crown, ArrowUpRight } from "lucide-react";

type ProUpgradeButtonProps = {
  title: string;
  subtitle: string;
};

export default function ProUpgradeButton({
  title,
  subtitle,
}: ProUpgradeButtonProps) {
  return (
    <section className="lm-upgrade-card">
      <div className="lm-upgrade-card__content">
        <div className="lm-upgrade-card__copy">
          <span className="lm-upgrade-card__badge">
            <Crown size={14} />
            PRO
          </span>

          <h3 className="lm-upgrade-card__title">{title}</h3>
          <p className="lm-upgrade-card__subtitle">{subtitle}</p>
        </div>

        <div className="lm-upgrade-card__actions">
          <Link href="/checkout" className="lm-upgrade-card__btn lm-upgrade-card__btn--primary">
            Fazer upgrade
            <ArrowUpRight size={15} />
          </Link>

          <Link href="/dashboard/conta" className="lm-upgrade-card__btn lm-upgrade-card__btn--ghost">
            Ver conta
          </Link>
        </div>
      </div>
    </section>
  );
}
