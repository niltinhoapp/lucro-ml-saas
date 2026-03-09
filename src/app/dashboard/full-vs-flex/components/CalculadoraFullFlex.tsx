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
  diferencaLucro: number; // ✅ FULL - FLEX (com sinal)
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

  // ⚠️ taxaML aqui continua sendo R$/un (como seu form está usando)
  const baseTaxa = Number(taxaML || 0) * u;

  const despesasFlex = baseCusto + baseTaxa + Number(freteMedio || 0) * u;
  const despesasFull = baseCusto + baseTaxa + Number(custoFull || 0) * u;

  const lucroFlex = receita - despesasFlex;
  const lucroFull = receita - despesasFull;

  const margemFlex = receita > 0 ? (lucroFlex / receita) * 100 : 0;
  const margemFull = receita > 0 ? (lucroFull / receita) * 100 : 0;

  // ✅ diferença COM SINAL: FULL - FLEX
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

  // ✅ PRO: persistência local
  const LS_KEY = "ff_historico_v1";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setHistorico(JSON.parse(raw));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const diff = moeda(Math.abs(resultado.diferencaLucro)); // ✅ abs só no texto
    return best === "FULL"
      ? `Recomendação: FULL está melhor (diferença ~ ${diff}).`
      : `Recomendação: FLEX está melhor (diferença ~ ${diff}).`;
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

  return (
    <>
      {/* ====== FORM / INPUTS (PRO) ====== */}
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Parâmetros</h2>
            <p>Preencha os custos por unidade. A calculadora compara FULL vs FLEX automaticamente.</p>
          </div>

          <div className="actions">
            <button className="btn btn-success" type="button" onClick={salvar}>
              + Salvar simulação
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                setNome("Simulação");
                setPrecoVenda(120);
                setCustoProduto(60);
                setTaxaML(18);
                setFreteMedio(22);
                setCustoFull(12);
                setUnidades(1);
                setModoDestaque("AUTO");
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* top controls */}
          <div className="ff-grid">
            <div className="ff-field">
              <div className="ff-label">Nome</div>
              <input
                className="ff-input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Avental Preto G"
              />
              <div className="ff-help">Aparece no histórico.</div>
            </div>

            <div className="ff-field">
              <div className="ff-label">Unidades</div>
              <input
                className="ff-input"
                type="number"
                min={1}
                value={unidades}
                onChange={(e) => setUnidades(Number(e.target.value))}
              />
              <div className="ff-help">Comparação por lote (ex: 10 vendas).</div>
            </div>
          </div>

          <div className="ff-grid">
            <div className="ff-field">
              <div className="ff-label">Preço de venda (un.)</div>
              <input
                className="ff-input"
                type="number"
                value={precoVenda}
                onChange={(e) => setPrecoVenda(Number(e.target.value))}
              />
            </div>

            <div className="ff-field">
              <div className="ff-label">Custo do produto (un.)</div>
              <input
                className="ff-input"
                type="number"
                value={custoProduto}
                onChange={(e) => setCustoProduto(Number(e.target.value))}
              />
              <div className="ff-help">Seu custo real (produto + embalagem se quiser).</div>
            </div>

            <div className="ff-field">
              <div className="ff-label">Taxa ML (un.)</div>
              <input
                className="ff-input"
                type="number"
                value={taxaML}
                onChange={(e) => setTaxaML(Number(e.target.value))}
              />
              <div className="ff-help">Comissão + tarifa fixa (por unidade).</div>
            </div>

            <div className="ff-field">
              <div className="ff-label">Frete médio FLEX (un.)</div>
              <input
                className="ff-input"
                type="number"
                value={freteMedio}
                onChange={(e) => setFreteMedio(Number(e.target.value))}
              />
              <div className="ff-help">Seu gasto médio no Flex por unidade.</div>
            </div>

            <div className="ff-field">
              <div className="ff-label">Custo extra FULL (un.)</div>
              <input
                className="ff-input"
                type="number"
                value={custoFull}
                onChange={(e) => setCustoFull(Number(e.target.value))}
              />
              <div className="ff-help">Custo do Full (armazenagem / picking / etc).</div>
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

          <div className="alert info" style={{ marginTop: 14 }}>
            <strong>Como a comparação funciona:</strong> FLEX usa <b>frete médio</b> como despesa extra.
            FULL usa <b>custo extra do Full</b>. O resto é igual (preço, custo, taxa).
          </div>
        </div>
      </section>

      {/* ====== RESULTADOS (KPIs PRO) ====== */}
      <ResultadoCards resultado={resultado} destaque={destaque} />

      {/* ====== GRÁFICO (PRO) ====== */}
      <GraficoLucro resultado={resultado} destaque={destaque} />

      {/* ====== HISTÓRICO (PREMIUM LIST) ====== */}
      <HistoricoSimulacoes itens={historico} onSelect={carregar} />
    </>
  );
}