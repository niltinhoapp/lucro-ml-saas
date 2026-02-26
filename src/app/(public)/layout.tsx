import Link from "next/link";
import type { ReactNode } from "react";
import ThemeToggle from "../../ThemeToggle";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="page-wrap">
      <header style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div style={{ fontWeight: 950, letterSpacing: "-0.02em" }}>
          <Link href="/" style={{ color: "rgba(255,255,255,.95)" }}>
            LUCRO ML
          </Link>{" "}
          <span style={{ color: "rgba(229,231,235,.60)" }}>• PRO</span>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <ThemeToggle />
          <Link className="btn btn-ghost" href="/demo">
            Demo
          </Link>
          <Link className="btn btn-primary" href="/dashboard">
            Entrar
          </Link>
        </div>
      </header>

      <div>{children}</div>
    </div>
  );
}