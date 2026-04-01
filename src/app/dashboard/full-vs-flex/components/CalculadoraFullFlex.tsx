"use client";

import { useEffect, useMemo, useState } from "react";
import ResultadoCards from "./ResultadoCards";
import GraficoLucro from "./GraficoLucro";
import HistoricoSimulacoes from "./HistoricoSimulacoes";

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

function moeda(v: number) {
  return Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function uid() {
  return Math.random().toString(16).slice(2, 10).toUpperCase();
}

function calcResultado({
  precoVenda,
  custoProduto,
  taxaML,
  freteMedio,
  custoFull,
  unidades,
}: {
  precoVenda: number;
  custoProduto: number;
  taxaML: number;
  freteMedio: number;
  custoFull: number;
  unidades: number;
}): ResultadoComparativo {
  const u = Math.max(1, Number(unidades || 1));

  const receita = Number(precoVenda || 0) * u;
  const baseCusto = Number(custoProduto || 0) * u;
  const baseTaxa = Number(taxaML || 0) * u;

  const despesasFlex = baseCusto + baseTaxa + Number(freteMedio || 0) * u;
  const despesasFull = baseCusto + baseTaxa + Number(custoFull || 0) * u;

  const lucroFlex = receita - despesasFlex;
  const lucroFull = receita - despesasFull;

  const margemFlex = receita > 0 ? (lucroFlex / receita) * 100 : 0;
  const margemFull = receita > 0 ? (lucroFull / receita) * 100 : 0;

  const diferencaLucro = lucroFull - lucroFlex;
  const melhor: "FULL" | "FLEX" = diferencaLucro >= 0 ? "FULL" : "FLEX";

  return {
    full: { receita, despesas: despesasFull, lucro: lucroFull, margem: margemFull },
    flex: { receita, despesas: despesasFlex, lucro: lucroFlex, margem: margemFlex },
    melhor,
    diferencaLucro,
  };
}

export default function CalculadoraFullFlex() {
  const [nome, setNome] = useState("Simulação");
  const [precoVenda, setPrecoVenda] = useState(120);
  const [custoProduto, setCustoProduto] = useState(60);
  const [taxaML, setTaxaML] = useState(18);
  const [freteMedio, setFreteMedio] = useState(22);
  const [custoFull, setCustoFull] = useState(12);
  const [unidades, setUnidades] = useState(1);

  const [modoDestaque, setModoDestaque] = useState<"FULL" | "FLEX" | "AUTO">("AUTO");
  const [historico, setHistorico] = useState<Simulacao[]>([]);

  const LS_KEY = "ff_historico_v1";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setHistorico(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(historico));
    } catch {}
  }, [historico]);

  const resultado = useMemo(
    () =>
      calcResultado({
        precoVenda,
        custoProduto,
        taxaML,
        freteMedio,
        custoFull,
        unidades,
      }),
    [precoVenda, custoProduto, taxaML, freteMedio, custoFull, unidades]
  );

  const destaque = useMemo(() => {
    if (modoDestaque === "AUTO") return resultado.melhor;
    return modoDestaque;
  }, [modoDestaque, resultado.melhor]);

  const recomendacaoTexto = useMemo(() => {
    const best = resultado.melhor;
    const diff = moeda(Math.abs(resultado.diferencaLucro));
    return best === "FULL"
      ? `Full está melhor por ${diff}.`
      : `Flex está melhor por ${diff}.`;
  }, [resultado.diferencaLucro, resultado.melhor]);

  function salvar() {
    const item: Simulacao = {
      id: uid(),
      data: new Date().toISOString(),
      nome: nome?.trim() ? nome.trim() : "Simulação",
      precoVenda,
      custoProduto,
      taxaML,
      freteMedio,
      custoFull,
      unidades,
      resultado,
    };

    setHistorico((prev) => [item, ...prev].slice(0, 50));
  }

  function carregar(item: Simulacao) {
    setNome(item.nome || "Simulação");
    setPrecoVenda(item.precoVenda);
    setCustoProduto(item.custoProduto);
    setTaxaML(item.taxaML);
    setFreteMedio(item.freteMedio);
    setCustoFull(item.custoFull);
    setUnidades(item.unidades);
    setModoDestaque("AUTO");
  }

  function resetar() {
    setNome("Simulação");
    setPrecoVenda(120);
    setCustoProduto(60);
    setTaxaML(18);
    setFreteMedio(22);
    setCustoFull(12);
    setUnidades(1);
    setModoDestaque("AUTO");
  }

  return (
    <>
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Preencha os dados</h2>
          </div>

          <div className="actions">
            <button className="btn btn-success" type="button" onClick={salvar}>
              Salvar
            </button>

            <button className="btn btn-ghost" type="button" onClick={resetar}>
              Limpar
            </button>
          </div>
        </div>

        <div className="card-body">
          <div className="ff-grid">
            <div className="ff-field">
              <div className="ff-label">Nome</div>
              <input
                className="ff-input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Produto principal"
              />
            </div>

            <div className="ff-field">
              <div className="ff-label">Quantidade</div>
              <input
                className="ff-input"
                type="number"
                min={1}
                value={unidades}
                onChange={(e) => setUnidades(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="ff-grid">
            <div className="ff-field">
              <div className="ff-label">Preço de venda</div>
              <input
                className="ff-input"
                type="number"
                value={precoVenda}
                onChange={(e) => setPrecoVenda(Number(e.target.value))}
              />
            </div>

            <div className="ff-field">
              <div className="ff-label">Custo do produto</div>
              <input
                className="ff-input"
                type="number"
                value={custoProduto}
                onChange={(e) => setCustoProduto(Number(e.target.value))}
              />
            </div>

            <div className="ff-field">
              <div className="ff-label">Taxa ML</div>
              <input
                className="ff-input"
                type="number"
                value={taxaML}
                onChange={(e) => setTaxaML(Number(e.target.value))}
              />
            </div>

            <div className="ff-field">
              <div className="ff-label">Frete Flex</div>
              <input
                className="ff-input"
                type="number"
                value={freteMedio}
                onChange={(e) => setFreteMedio(Number(e.target.value))}
              />
            </div>

            <div className="ff-field">
              <div className="ff-label">Custo Full</div>
              <input
                className="ff-input"
                type="number"
                value={custoFull}
                onChange={(e) => setCustoFull(Number(e.target.value))}
              />
            </div>

            <div className="ff-field">
              <div className="ff-label">Destaque</div>

              <div className="ff-seg">
                <button
                  type="button"
                  className={`ff-seg-btn ${modoDestaque === "AUTO" ? "active" : ""}`}
                  onClick={() => setModoDestaque("AUTO")}
                >
                  Auto
                </button>

                <button
                  type="button"
                  className={`ff-seg-btn ${modoDestaque === "FULL" ? "active" : ""}`}
                  onClick={() => setModoDestaque("FULL")}
                >
                  Full
                </button>

                <button
                  type="button"
                  className={`ff-seg-btn ${modoDestaque === "FLEX" ? "active" : ""}`}
                  onClick={() => setModoDestaque("FLEX")}
                >
                  Flex
                </button>
              </div>

              <div className="ff-help">{recomendacaoTexto}</div>
            </div>
          </div>
        </div>
      </section>

      <ResultadoCards resultado={resultado} destaque={destaque} />
      <GraficoLucro resultado={resultado} destaque={destaque} />
      <HistoricoSimulacoes itens={historico} onSelect={carregar} />
    </>
  );
}