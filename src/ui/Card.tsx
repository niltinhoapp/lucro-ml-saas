import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  headClassName?: string;
  bodyClassName?: string;
  copyClassName?: string;
  actionsClassName?: string;
};

export default function Card({
  title,
  subtitle,
  children,
  actions,
  className,
  headClassName,
  bodyClassName,
  copyClassName,
  actionsClassName,
}: CardProps) {
  const hasHead = Boolean(title || subtitle || actions);

  return (
    <section className={["lm-card", className].filter(Boolean).join(" ")}>
      {hasHead ? (
        <div
          className={["lm-card__head", headClassName]
            .filter(Boolean)
            .join(" ")}
        >
          <div
            className={["lm-card__copy", copyClassName]
              .filter(Boolean)
              .join(" ")}
          >
            {title ? <h3 className="lm-card__title">{title}</h3> : null}
            {subtitle ? <p className="lm-card__subtitle">{subtitle}</p> : null}
          </div>

          {actions ? (
            <div
              className={["lm-card__actions", actionsClassName]
                .filter(Boolean)
                .join(" ")}
            >
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className={["lm-card__body", bodyClassName]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>
    </section>
  );
}
