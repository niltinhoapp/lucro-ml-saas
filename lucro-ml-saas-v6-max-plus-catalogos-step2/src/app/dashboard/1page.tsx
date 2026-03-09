"use client";

export default function DashboardHome() {
  const receita = 503839;
  const despesas = 420120;
  const lucro = receita - despesas;
  const margem = (lucro / receita) * 100;

  return (
    <>
      <header className="page-header">
        <h2>Visão Geral</h2>
        <p>Acompanhe a saúde financeira do seu negócio</p>
      </header>

      <section className="cards">
        <div className="card">
          <h3>Receita Total</h3>
          <div className="value" style={{ color: "var(--primary)" }}>
            R$ {receita.toLocaleString("pt-BR")}
          </div>
        </div>

        <div className="card">
          <h3>Despesas</h3>
          <div className="value" style={{ color: "var(--danger)" }}>
            R$ {despesas.toLocaleString("pt-BR")}
          </div>
        </div>

        <div className="card">
          <h3>Lucro</h3>
          <div className="value" style={{ color: "var(--success)" }}>
            R$ {lucro.toLocaleString("pt-BR")}
          </div>
        </div>

        <div className="card">
          <h3>Margem</h3>
          <div className="value" style={{ color: "var(--success)" }}>
            {margem.toFixed(2)}%
          </div>
        </div>
      </section>
    </>
  );
}
