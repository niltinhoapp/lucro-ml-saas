import Link from "next/link";
import type { ReactNode } from "react";
import ThemeToggle from "../../ThemeToggle";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="page-wrap" style={{ minHeight: "100vh", padding: "18px" }}>
      <header
        style={{
          maxWidth: "1180px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/" style={{ fontWeight: 900, letterSpacing: "-0.03em" }}>
            LUCRO ML
          </Link>
          <span className="badge pro">PRO</span>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <ThemeToggle />
          <Link className="btn btn-ghost" href="/raio-x">
            Raio-X grátis
          </Link>
          <Link className="btn btn-ghost" href="/demo">
            Demo
          </Link>
          <Link className="btn btn-primary" href="/auth/login">
            Entrar
          </Link>
        </div>
      </header>

      <div>{children}</div>
    </div>
  );
}



