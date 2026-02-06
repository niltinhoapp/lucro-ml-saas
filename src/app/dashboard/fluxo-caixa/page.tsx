"use client";

import { useMemo } from "react";

interface Fluxo {
  data: string;
  entrada: number;
  saida: number;
}

const fluxoData: Fluxo[] = [
  { data: "01/02", entrada: 5000, saida: 2000 },
  { data: "02/02", entrada: 7000, saida: 3000 },
  { data: "03/02", entrada: 6000, saida: 1000 },
];

export default function FluxoCaixaPage() {
  const resumo = useMemo(() => {
    const entradas = fluxoData.reduce((a, b) => a + b.entrada, 0);
    const saidas = fluxoData.reduce((a, b) => a + b.saida, 0);
    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
    };
  }, []);

  return (
    <div className="page">
      {/* HEADER */}
      <header className="page-header">
        <h2>Fluxo de Caixa</h2>
        <p>Controle diário de entradas e saídas</p>
      </header>

      {/* RESUMO */}
      <section className="grid-3">
        <div className="summary-card">
          <p>Entradas</p>
          <div className="value" style={{ color: "var(--success)" }}>
            R$ {resumo.entradas.toLocaleString("pt-BR")}
          </div>
        </div>

        <div className="summary-card">
          <p>Saídas</p>
          <div className="value" style={{ color: "var(--danger)" }}>
            R$ {resumo.saidas.toLocaleString("pt-BR")}
          </div>
        </div>

        <div className="summary-card">
          <p>Saldo Total</p>
          <div
            className="value"
            style={{
              color:
                resumo.saldo >= 0
                  ? "var(--success)"
                  : "var(--danger)",
            }}
          >
            R$ {resumo.saldo.toLocaleString("pt-BR")}
          </div>
        </div>
      </section>

      {/* TABELA */}
      <section className="table-card">
        <div className="table-card-header">
          Movimentações
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Entrada</th>
                <th>Saída</th>
                <th>Saldo</th>
              </tr>
            </thead>

            <tbody>
              {fluxoData.map((f, i) => {
                const saldo = f.entrada - f.saida;

                return (
                  <tr key={i}>
                    <td>{f.data}</td>

                    <td style={{ color: "var(--success)", fontWeight: 500 }}>
                      + R$ {f.entrada.toLocaleString("pt-BR")}
                    </td>

                    <td style={{ color: "var(--danger)", fontWeight: 500 }}>
                      - R$ {f.saida.toLocaleString("pt-BR")}
                    </td>

                    <td
                      style={{
                        fontWeight: 600,
                        color:
                          saldo >= 0
                            ? "var(--success)"
                            : "var(--danger)",
                      }}
                    >
                      R$ {saldo.toLocaleString("pt-BR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
