"use client";

import type { ReactNode } from "react";

type DashboardShellProps = {
  children: ReactNode;
  className?: string;
};

export default function DashboardShell({
  children,
  className,
}: DashboardShellProps) {
  return (
    <main
      className={[
        "lm-dashboard-shell",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="lm-dashboard-shell__page">{children}</div>
    </main>
  );
}
