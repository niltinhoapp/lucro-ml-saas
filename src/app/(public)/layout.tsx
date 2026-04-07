import Link from "next/link";
import type { ReactNode } from "react";
import ThemeToggle from "../../ThemeToggle";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="public-shell">
      <header className="public-header">
        <div className="public-header-inner">
          <div className="public-brand">
            <Link href="/" className="public-brand-link">
              LUCRO ML
            </Link>
            <span className="badge pro">SELLER</span>
          </div>

          <div className="public-header-actions">
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
        </div>
      </header>

      <main className="public-main">{children}</main>
    </div>
  );
}





