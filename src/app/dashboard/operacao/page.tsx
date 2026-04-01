
import Link from "next/link";
import { moduleCards } from "@/features/dashboard/shared/dashboard-data";

export default function OperacaoPage() {
  const module = moduleCards.find((item) => item.title === "Operação");

  if (!module) return null;

  return (
    <div className="page-wrap" style={{ display: "grid", gap: 18 }}>
      <section className="card card-premium">
        <div className="card-head">
          <div>
            <h1>Operação</h1>
            <p className="subtitle">{module.summary}</p>
          </div>
        </div>
      </section>

      <section className="dashhome-section card card-premium">
        <div className="dashhome-grid">
          {module.items.map((item) => (
            <Link key={item.href} href={item.href} className="dashhome-card">
              <div className="dashhome-card-body">
                <div className="dashhome-card-top">
                  <h3>{item.label}</h3>
                </div>
                <p className="dashhome-card-desc">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
