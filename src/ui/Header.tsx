import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export default function Card({
  title,
  subtitle,
  children,
  actions,
  className,
}: CardProps) {
  return (
    <section className={["lm-card", className].filter(Boolean).join(" ")}>
      {(title || subtitle || actions) && (
        <div className="lm-card__head">
          <div className="lm-card__copy">
            {title ? <h3 className="lm-card__title">{title}</h3> : null}
            {subtitle ? <p className="lm-card__subtitle">{subtitle}</p> : null}
          </div>

          {actions ? <div className="lm-card__actions">{actions}</div> : null}
        </div>
      )}

      <div className="lm-card__body">{children}</div>
    </section>
  );
}
