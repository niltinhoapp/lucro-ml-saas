"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

const menu = [
  { label: "Site", href: "/" },
  { label: "Painel executivo", href: "/dashboard" },
  { label: "Diagnóstico de lucro", href: "/dashboard/diagnostico" },
  { label: "Inteligência de mercado", href: "/dashboard/inteligencia" },
  { label: "Gerador de kits", href: "/dashboard/kits" },
  { label: "Radar de oportunidades", href: "/dashboard/radar" },
  { label: "Simulador de estoque", href: "/dashboard/simulador" },
  { label: "Catálogos", href: "/dashboard/catalogos" },
  { label: "DRE", href: "/dashboard/dre" },
  { label: "Fluxo de caixa", href: "/dashboard/fluxo-caixa" },
  { label: "Full vs Flex", href: "/dashboard/full-vs-flex" },
  { label: "Histórico", href: "/dashboard/historico" },
  { label: "Raio-X grátis", href: "/raio-x" },
  { label: "Assinar PRO", href: "/checkout" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href + "?");
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-layout">
      <aside className="sidebar sidebar-pro">
        <div className="sidebar-head">
          <h1 className="sidebar-logo">Lucro ML</h1>
          <div className="sidebar-badge-row">
            <span className="badge pro">SELLER PRO / PLUS</span>
          </div>
          <p className="sidebar-tagline">Inteligência prática para precificar, validar catálogo, montar kit e proteger margem.</p>
        </div>

        <nav className="sidebar-nav">
          {menu.map((item) => {
            const active = isActive(pathname, item.href);
            const className = item.href === "/checkout"
              ? active ? "active sidebar-link-pro" : "sidebar-link-pro"
              : active ? "active" : undefined;

            return (
              <Link key={item.href} href={item.href} className={className}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          Lucro ML • inteligência de lucro para vendedores
        </div>
      </aside>

      <main className="main">
        <div className="page dashboard-page">{children}</div>
      </main>
    </div>
  );
}
