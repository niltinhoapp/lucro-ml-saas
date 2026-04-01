"use client";

type Resultado = {
  receita: number;
  despesas: number;
  lucro: number;
  margem: number;
};

type ResultadoComparativo = {
  full: Resultado;
  flex: Resultado;
  melhor: "FULL" | "FLEX";
  diferencaLucro: number; // FULL - FLEX
};

function moeda(v: number) {
  return Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function pct(v: number) {
  return `${Number(v || 0).toFixed(2)}%`;
}

function toneMargem(m: number): "good" | "warn" | "bad" {
  if (m >= 12) return "good";
  if (m >= 0) return "warn";
  return "bad";
}

export default function ResultadoCards({
  resultado,
  destaque,
}: {
  resultado: ResultadoComparativo;
  destaque: "FULL" | "FLEX";
}) {
  const r = destaque === "FULL" ? resultado.full : resultado.flex;

  const margemTone = toneMargem(r.margem);
  const lucroTone = r.lucro >= 0 ? "good" : "bad";

  const diff = Number(resultado.diferencaLucro || 0);
  const diffAbs = Math.abs(diff);
  const diffSide = diff >= 0 ? "FULL" : "FLEX";

  return (
    <section className="grid-3">
      <div className="kpi-card kpi-receita">
        <div className="kpi-label">Receita</div>
        <div className="kpi-value">{moeda(r.receita)}</div>

        <div className="muted" style={{ marginTop: 8, fontWeight: 900 }}>
          Melhor: <b>{resultado.melhor}</b>
        </div>
      </div>

      <div className="kpi-card kpi-despesas">
        <div className="kpi-label">Despesas</div>
        <div className="kpi-value">{moeda(r.despesas)}</div>

        <div className="muted" style={{ marginTop: 8, fontWeight: 900 }}>
          Diferença: <b>{moeda(diffAbs)}</b> • {diffSide}
        </div>
      </div>

      <div
        className={`kpi-card ${
          margemTone === "good"
            ? "kpi-margem-good"
            : margemTone === "warn"
            ? "kpi-margem-warn"
            : "kpi-margem-bad"
        }`}
      >
        <div className="kpi-label">Lucro / Margem</div>
        <div className="kpi-value">
          {moeda(r.lucro)}{" "}
          <span style={{ opacity: 0.85, fontSize: 16 }}>• {pct(r.margem)}</span>
        </div>

        <div
          className="pills"
          style={{ marginTop: 10, justifyContent: "flex-start" }}
        >
          <span className={`pill ${lucroTone === "good" ? "good" : "bad"}`}>
            {r.lucro >= 0 ? "Lucro positivo" : "Prejuízo"}
          </span>

          <span
            className={`pill ${
              margemTone === "good"
                ? "good"
                : margemTone === "warn"
                ? "warn"
                : "bad"
            }`}
          >
            {margemTone === "good"
              ? "Margem boa"
              : margemTone === "warn"
              ? "Margem apertada"
              : "Margem negativa"}
          </span>
        </div>
      </div>
    </section>
  );
}