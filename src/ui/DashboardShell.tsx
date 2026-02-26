"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

const menu = [
  { label: "🏠 Home (Site)", href: "/" },
  { label: "📌 Painel", href: "/dashboard" },
  { label: "📊 DRE", href: "/dashboard/dre" },
  { label: "💰 Fluxo de Caixa", href: "/dashboard/fluxo-caixa" },
  { label: "🚚 Full vs Flex", href: "/dashboard/full-vs-flex" },
  { label: "🕒 Histórico", href: "/dashboard/historico" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href + "?") || pathname.startsWith(href);
}

export default function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div style={{ marginBottom: "1.25rem" }}>
          <h1>Lucro ML</h1>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <span className="badge pro">⚡ PRO</span>
          </div>
          <p style={{ textAlign: "center", marginTop: "0.75rem", color: "rgba(229,231,235,0.75)", fontSize: "0.85rem" }}>
            Inteligência de margem
          </p>
        </div>

        <nav>
          {menu.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} className={active ? "active" : ""}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.12)", color: "rgba(229,231,235,0.75)", fontSize: "0.8rem", textAlign: "center" }}>
          © {new Date().getFullYear()} Lucro ML
        </div>
      </aside>

      <main className="main">
        <div className="page">{children}</div>
      </main>
    </div>
  );
}