import type { ReactNode } from "react";
import Sidebar from "@/ui/Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-layout premium-app-layout dashboard-main-shell">
      <Sidebar />

      <main className="main dashboard-main-content">
        <div className="page page-wrap">{children}</div>
      </main>
    </div>
  );
}
