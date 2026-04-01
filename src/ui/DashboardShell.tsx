"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  BarChart3,
  Wallet,
  Truck,
  History,
  Crown,
} from "lucide-react";

const menuMain = [
  { label: "Visão Geral", href: "/dashboard", icon: LayoutDashboard },
  { label: "DRE", href: "/dashboard/dre", icon: BarChart3 },
  { label: "Fluxo de Caixa", href: "/dashboard/fluxo-caixa", icon: Wallet },
  { label: "Full vs Flex", href: "/dashboard/lucro/full-vs-flex", icon: Truck },
  { label: "Histórico", href: "/dashboard/historico", icon: History },
];

const menuSecondary = [
  { label: "Site", href: "/", icon: Home },
  { label: "Upgrade PRO", href: "/checkout", icon: Crown },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/dashboard") return pathname === "/dashboard";

  return (
    pathname === href ||
    pathname.startsWith(href + "/") ||
    pathname.startsWith(href + "?")
  );
}

export default function DashboardShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="app-layout">
      <aside className="sidebar sidebar-pro" aria-label="Navegação do dashboard">
        <div className="sidebar-head">
          <div className="sidebar-brand">
            <div className="sidebar-brand-mark">LM</div>

            <div className="sidebar-brand-copy">
              <h1 className="sidebar-logo">Lucro ML</h1>
              <p className="sidebar-tagline">Inteligência para sellers</p>
            </div>
          </div>

          <div className="sidebar-badge-row">
            <span className="badge pro">PRO</span>
          </div>
        </div>

        <div className="sidebar-group">
          <div className="sidebar-group-label">Operação</div>

          <nav className="sidebar-nav">
            {menuMain.map(({ label, href, icon: Icon }) => {
              const active = isActive(pathname, href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={active ? "sidebar-link active" : "sidebar-link"}
                >
                  <Icon size={18} strokeWidth={2} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-divider" />

        <div className="sidebar-group">
          <div className="sidebar-group-label">Conta</div>

          <nav className="sidebar-nav">
            {menuSecondary.map(({ label, href, icon: Icon }) => {
              const active = isActive(pathname, href);

              const className =
                label === "Upgrade PRO"
                  ? active
                    ? "sidebar-link sidebar-link-pro active"
                    : "sidebar-link sidebar-link-pro"
                  : active
                    ? "sidebar-link active"
                    : "sidebar-link";

              return (
                <Link key={href} href={href} className={className}>
                  <Icon size={18} strokeWidth={2} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-footer">
          © {new Date().getFullYear()} Lucro ML
        </div>
      </aside>

      <main className="main">
        <div className="page">{children}</div>
      </main>
    </div>
  );
}
