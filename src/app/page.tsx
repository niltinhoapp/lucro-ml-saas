"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

const menu = [
  { label: "Home", href: "/dashboard" },
  { label: "DRE", href: "/dashboard/dre" },
  { label: "Fluxo de Caixa", href: "/dashboard/fluxo-caixa" },
  { label: "Full vs Flex", href: "/dashboard/full-vs-flex" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-900 text-gray-200 flex flex-col">
        {/* LOGO / BRAND */}
        <div className="px-6 py-5 border-b border-gray-800">
          <h1 className="text-xl font-bold tracking-wide text-white">
            Lucro ML
          </h1>
          <p className="text-xs text-gray-400">
            Gestão financeira
          </p>
        </div>

        {/* MENU */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menu.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2 rounded-lg transition
                  ${
                    active
                      ? "bg-blue-600 text-white font-semibold"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER SIDEBAR */}
        <div className="px-6 py-4 border-t border-gray-800 text-xs text-gray-400">
          © {new Date().getFullYear()} Lucro ML
        </div>
      </aside>

      {/* CONTEÚDO */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
