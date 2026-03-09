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
  diferencaLucro: number;
};

type Simulacao = {
  id: string;
  data: string;
  nome?: string;
  precoVenda: number;
  custoProduto: number;
  taxaML: number;
  freteMedio: number;
  custoFull: number;
  unidades: number;
  resultado: ResultadoComparativo;
};

function moeda(v: number) {
  return (Number(v || 0)).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataBR(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("pt-BR");
}

export default function HistoricoSimulacoes({
  itens,
  onSelect,
}: {
  itens: Simulacao[];
  onSelect: (s: Simulacao) => void;
}) {
  return (
    <section className="historico-page card">
      <div className="card-head">
        <div>
          <h2>Histórico</h2>
          <p>Clique numa simulação para carregar.</p>
        </div>

        <div className="badges">
          <span className="badge pro">PRO</span>
          <span className="badge">{itens.length} salvas</span>
        </div>
      </div>

      <div className="card-body" style={{ padding: 0 }}>
        {itens.length === 0 ? (
          <div style={{ padding: 18 }}>
            <div className="alert info">
              Nenhuma simulação salva ainda. Preencha os valores e clique em <b>“Salvar simulação”</b>.
            </div>
          </div>
        ) : (
          <div className="list">
            {itens.map((s) => {
              const best = s.resultado.melhor;
              const lucroBest = best === "FULL" ? s.resultado.full.lucro : s.resultado.flex.lucro;
              const margemBest = best === "FULL" ? s.resultado.full.margem : s.resultado.flex.margem;

              return (
                <div key={s.id} className="row" onClick={() => onSelect(s)} role="button">
                  <div>
                    <div className="title">{s.nome || `Simulação #${s.id}`}</div>
                    <div className="meta">
                      {dataBR(s.data)} • Unidades: <b>{s.unidades}</b> • Melhor: <b>{best}</b>
                    </div>
                  </div>

                  <div className="right">
                    <div className="pills">
                      <span className={`pill ${lucroBest >= 0 ? "good" : "bad"}`}>
                        Lucro: {moeda(lucroBest)}
                      </span>
                      <span className={`pill ${margemBest >= 12 ? "good" : margemBest >= 0 ? "warn" : "bad"}`}>
                        Margem: {margemBest.toFixed(2)}%
                      </span>
                    </div>
                    <div className="small">Abrir simulação →</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}