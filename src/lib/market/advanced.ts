export type ProductInputs = {
  produto: string;
  categoria?: string;
  precoVenda: number;
  custoProduto: number;
  frete: number;
  taxaPercent: number;
  devolucaoPercent?: number;
  adsPercent?: number;
};

export type SpreadsheetRowInput = {
  nome: string;
  receita: number;
  custo: number;
  taxa: number;
  frete: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

function keywordFactor(text: string) {
  const v = text.toLowerCase();

  if (/(kit|combo|bundle)/.test(v)) return 1.08;
  if (/(premium|profissional|4k|turbo)/.test(v)) return 1.12;
  if (/(refil|suporte|organizador)/.test(v)) return 1.05;

  return 1;
}

export function calcProductHealth(input: ProductInputs) {
  const devolucao = input.devolucaoPercent ?? 2.5;
  const ads = input.adsPercent ?? 6;

  const taxas = input.precoVenda * (input.taxaPercent / 100);
  const devolucaoCusto = input.precoVenda * (devolucao / 100);
  const adsCusto = input.precoVenda * (ads / 100);

  const lucro =
    input.precoVenda -
    input.custoProduto -
    input.frete -
    taxas -
    devolucaoCusto -
    adsCusto;

  const margem = input.precoVenda > 0 ? (lucro / input.precoVenda) * 100 : 0;

  const scoreBase =
    margem * 2.8 -
    (input.frete / Math.max(1, input.precoVenda)) * 120 +
    (18 - input.taxaPercent) +
    (6 - devolucao);

  const score = clamp(
    Math.round(scoreBase * keywordFactor(input.produto) + 45),
    1,
    99
  );

  const status =
    score >= 75 ? "excelente" : score >= 50 ? "atencao" : "risco";

  const precoMinimo = round(
    (input.custoProduto + input.frete) /
      Math.max(0.01, 1 - (input.taxaPercent + devolucao + ads) / 100)
  );

  const alertas: string[] = [];

  if (margem < 12) {
    alertas.push("Margem baixa para sustentar crescimento.");
  }

  if (input.frete / Math.max(1, input.precoVenda) > 0.15) {
    alertas.push("Frete está consumindo o lucro.");
  }

  if (input.taxaPercent >= 16) {
    alertas.push("Taxa alta impactando margem.");
  }

  if (!alertas.length) {
    alertas.push("Produto saudável para escalar.");
  }

  return {
    produto: input.produto,
    categoria: input.categoria ?? "geral",
    lucro: round(lucro),
    margem: round(margem),
    score,
    status,
    precoMinimo,
    alertas,
    breakdown: {
      taxas: round(taxas),
      devolucao: round(devolucaoCusto),
      ads: round(adsCusto),
      frete: round(input.frete),
      custoProduto: round(input.custoProduto),
    },
  };
}

export function generateKitIdeas(
  produto: string,
  categoria: string,
  preco: number
) {
  const base = round(preco * 1.6);
  const categoriaNormalizada = (categoria || "geral").trim() || "geral";
  const produtoNormalizado = (produto || "Produto principal").trim() || "Produto principal";

  return {
    produto: produtoNormalizado,
    categoria: categoriaNormalizada,
    estrategia: [
      "Monte um kit com foto principal mostrando o conjunto.",
      "Use título destacando economia comparada à compra separada.",
      "Teste versão de entrada, principal e premium.",
    ],
    kits: [
      {
        nome: `${produtoNormalizado} + acessório`,
        perfil: "Entrada",
        precoSugerido: round(base * 0.9),
        margemEstimada: "18% a 24%",
        motivo: "Aumenta ticket sem elevar tanto a barreira de compra.",
      },
      {
        nome: `${produtoNormalizado} kit completo`,
        perfil: "Principal",
        precoSugerido: base,
        margemEstimada: "22% a 30%",
        motivo: "Melhora percepção de valor e reduz comparação direta por preço.",
      },
      {
        nome: `${produtoNormalizado} combo premium`,
        perfil: "Alta margem",
        precoSugerido: round(base * 1.2),
        margemEstimada: "24% a 34%",
        motivo: "Ajuda a subir ticket médio em operação mais madura.",
      },
    ],
  };
}

export function stockBuySimulator(params: {
  produto: string;
  precoVenda: number;
  custoUnitario: number;
  freteUnitario: number;
  taxaPercent: number;
  quantidade: number;
  giroMensal: number;
}) {
  const health = calcProductHealth({
    produto: params.produto,
    precoVenda: params.precoVenda,
    custoProduto: params.custoUnitario,
    frete: params.freteUnitario,
    taxaPercent: params.taxaPercent,
    devolucaoPercent: 2.5,
    adsPercent: 5,
  });

  const investimento = round(params.custoUnitario * params.quantidade);
  const lucroTotal = round(health.lucro * params.quantidade);
  const meses = round(params.quantidade / Math.max(1, params.giroMensal));
  const retorno = investimento > 0 ? round((lucroTotal / investimento) * 100) : 0;

  return {
    produto: params.produto,
    investimento,
    lucroTotal,
    meses,
    retorno,
    margem: health.margem,
    parecer:
      meses <= 2 && health.margem > 15
        ? "Compra saudável"
        : meses <= 3 && health.margem > 10
        ? "Compra possível com controle"
        : "Compra arriscada",
    acoes: [
      "Negocie custo unitário antes de aumentar volume.",
      "Acompanhe giro mensal real para evitar capital parado.",
      "Teste versão em kit para melhorar ROI.",
    ],
  };
}

export function hiddenLossDetector(input: ProductInputs) {
  const health = calcProductHealth(input);

  const perdas = [
    {
      item: "Taxas do canal",
      valor: health.breakdown.taxas,
      nivel: input.taxaPercent >= 16 ? "alto" : "medio",
    },
    {
      item: "Frete e logística",
      valor: health.breakdown.frete,
      nivel: input.frete / Math.max(1, input.precoVenda) > 0.14 ? "alto" : "medio",
    },
    {
      item: "Devoluções",
      valor: health.breakdown.devolucao,
      nivel: (input.devolucaoPercent ?? 2.5) >= 4 ? "alto" : "baixo",
    },
    {
      item: "Tráfego / impulso",
      valor: health.breakdown.ads,
      nivel: (input.adsPercent ?? 6) >= 8 ? "alto" : "medio",
    },
  ].sort((a, b) => b.valor - a.valor);

  return {
    ...health,
    perdas,
    conclusao:
      health.margem >= 15
        ? "Seu produto suporta crescimento, mas ainda merece ajuste fino nos custos invisíveis."
        : "O lucro aparente está sendo consumido por custos invisíveis. Ajustar preço e composição é prioridade.",
    acoes: [
      `Teste preço alvo acima de R$ ${health.precoMinimo.toFixed(2)} para recuperar margem.`,
      "Reavalie anúncios com frete pesado e monte kits para diluir logística.",
      "Separe SKU de alto retorno e baixo retorno para evitar escalar prejuízo escondido.",
    ],
  };
}

export function planilhaDiagnostic(rows: SpreadsheetRowInput[]) {
  const normalized = rows.map((row) => {
    const health = calcProductHealth({
      produto: row.nome,
      precoVenda: row.receita,
      custoProduto: row.custo,
      frete: row.frete,
      taxaPercent: row.receita > 0 ? (row.taxa / row.receita) * 100 : 16,
      devolucaoPercent: 2,
      adsPercent: 4,
    });

    return {
      ...row,
      ...health,
    };
  });

  const campeoes = normalized
    .filter((r) => r.score >= 75)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const alertas = normalized
    .filter((r) => r.score < 50)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  const resumo = {
    totalProdutos: normalized.length,
    lucroMedio: round(
      normalized.reduce((acc, item) => acc + item.lucro, 0) /
        Math.max(1, normalized.length)
    ),
    margemMedia: round(
      normalized.reduce((acc, item) => acc + item.margem, 0) /
        Math.max(1, normalized.length)
    ),
  };

  return {
    resumo,
    campeoes,
    alertas,
    recomendacoes: [
      "Escalar apenas SKUs com score alto e margem repetível.",
      "Reprecificar ou transformar em kit os produtos com score de risco.",
      "Separar planilha por campeões, estáveis e drenadores de caixa.",
    ],
  };
}