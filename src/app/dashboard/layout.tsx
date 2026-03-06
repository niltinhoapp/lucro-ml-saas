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
  { label: "💳 Assinar PRO", href: "/checkout" },
];




function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="app-layout">
      <aside className="sidebar sidebar-pro">
        <div className="sidebar-head">
          <h1 className="sidebar-logo">Lucro ML</h1>

          <div className="sidebar-badge-row">
            <span className="badge pro">⚡ PRO</span>
          </div>

          <p className="sidebar-tagline">Inteligência de margem</p>
        </div>

        <nav className="sidebar-nav">
          {menu.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "active" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          © {new Date().getFullYear()} Lucro ML
        </div>
      </aside>

      <main className="main">
        <div className="page dashboard-page">{children}</div>
      </main>
    </div>
  );
}