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

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function keywordFactor(text: string) {
  const value = text.toLowerCase();
  if (/(kit|combo|bundle)/.test(value)) return 1.08;
  if (/(premium|profissional|4k|amol|turbo)/.test(value)) return 1.12;
  if (/(capa|pelicula|suporte|organizador|refil)/.test(value)) return 1.06;
  return 1;
}

export function calcProductHealth(input: ProductInputs) {
  const devolucao = input.devolucaoPercent ?? 2;
  const ads = input.adsPercent ?? 6;
  const taxas = input.precoVenda * (input.taxaPercent / 100);
  const devolucaoCusto = input.precoVenda * (devolucao / 100);
  const adsCusto = input.precoVenda * (ads / 100);
  const lucro = input.precoVenda - input.custoProduto - input.frete - taxas - devolucaoCusto - adsCusto;
  const margem = input.precoVenda > 0 ? (lucro / input.precoVenda) * 100 : 0;
  const pricePower = keywordFactor(input.produto);
  const scoreBase = margem * 2.6 + (12 - input.frete / Math.max(1, input.precoVenda) * 100) + (18 - input.taxaPercent) + (6 - devolucao);
  const score = clamp(Math.round(scoreBase * pricePower + 45), 1, 99);

  const status = score >= 75 ? "excelente" : score >= 50 ? "atenção" : "risco";
  const recomendacaoPreco = round2(
    (input.custoProduto + input.frete) / Math.max(0.01, 1 - (input.taxaPercent + devolucao + ads) / 100 - 0.18),
  );

  const alertas: string[] = [];
  if (margem < 10) alertas.push("Margem apertada para absorver devolução, tráfego pago e oscilação de frete.");
  if (input.frete / Math.max(1, input.precoVenda) > 0.14) alertas.push("Frete está pesado para o ticket atual.");
  if (input.taxaPercent >= 16) alertas.push("Taxa do canal pressiona sua rentabilidade.");
  if (devolucao >= 4) alertas.push("Percentual de devolução já pode corroer lucro escondido.");
  if (!alertas.length) alertas.push("Estrutura saudável para escalar com mais segurança.");

  return {
    lucro: round2(lucro),
    margem: round2(margem),
    score,
    status,
    recomendacaoPreco,
    alertas,
    breakdown: {
      taxas: round2(taxas),
      devolucao: round2(devolucaoCusto),
      ads: round2(adsCusto),
    },
  };
}

export function generateKitIdeas(produto: string, categoria: string, precoBase: number) {
  const name = produto.trim() || "Produto principal";
  const cat = categoria.trim() || "geral";
  const baseFactor = keywordFactor(`${name} ${cat}`);
  const kitBase = round2(precoBase * (1.58 * baseFactor));

  const accessoriesByCategory: Record<string, string[]> = {
    beleza: ["refil", "escova auxiliar", "bolsa organizadora"],
    eletronicos: ["película", "suporte", "case protetora"],
    eletrônicos: ["película", "suporte", "case protetora"],
    automotivo: ["suporte", "adaptador", "organizador"],
    casa: ["refil", "suporte", "organizador"],
    geral: ["acessório complementar", "item de reposição", "versão premium"],
  };

  const picks = accessoriesByCategory[cat.toLowerCase()] ?? accessoriesByCategory.geral;

  const kits = [
    {
      nome: `${name} + ${picks[0]}`,
      perfil: "Kit de entrada",
      precoSugerido: round2(kitBase * 0.92),
      margemEstimada: "18% a 24%",
      motivo: "Aumenta ticket sem elevar muito a barreira de compra.",
    },
    {
      nome: `${name} + ${picks[0]} + ${picks[1]}`,
      perfil: "Kit campeão",
      precoSugerido: round2(kitBase),
      margemEstimada: "22% a 31%",
      motivo: "Melhora percepção de valor e dificulta comparação direta por preço.",
    },
    {
      nome: `${name} + ${picks[0]} + ${picks[1]} + ${picks[2]}`,
      perfil: "Bundle premium",
      precoSugerido: round2(kitBase * 1.18),
      margemEstimada: "24% a 34%",
      motivo: "Ideal para subir ticket médio em anúncios com boa reputação.",
    },
  ];

  return {
    produto: name,
    categoria: cat,
    estrategia: [
      "Monte o kit com foto principal já mostrando o conjunto.",
      "Use título destacando economia comparada à compra separada.",
      "Crie variações de ticket: entrada, campeão e premium.",
    ],
    kits,
  };
}

export function hiddenLossDetector(input: ProductInputs) {
  const health = calcProductHealth(input);
  const perdas = [
    { item: "Taxas do canal", valor: health.breakdown.taxas, nivel: input.taxaPercent >= 16 ? "alto" : "médio" },
    { item: "Frete e logística", valor: round2(input.frete), nivel: input.frete / Math.max(1, input.precoVenda) > 0.14 ? "alto" : "médio" },
    { item: "Devoluções", valor: health.breakdown.devolucao, nivel: (input.devolucaoPercent ?? 2) >= 4 ? "alto" : "baixo" },
    { item: "Tráfego / impulso", valor: health.breakdown.ads, nivel: (input.adsPercent ?? 6) >= 8 ? "alto" : "médio" },
  ].sort((a, b) => b.valor - a.valor);

  return {
    ...health,
    perdas,
    conclusao:
      health.margem >= 15
        ? "Seu produto suporta crescimento, mas ainda merece ajuste fino nos custos invisíveis."
        : "O lucro aparente está sendo consumido por custos invisíveis. Ajustar preço e composição é prioridade.",
    acoes: [
      `Teste preço alvo em R$ ${health.recomendacaoPreco.toFixed(2)} para recuperar margem.` ,
      "Reavalie anúncios com frete pesado e crie kit para diluir logística.",
      "Separe SKU de alto retorno e baixo retorno para parar de escalar prejuízo escondido.",
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
  const investimento = round2(params.custoUnitario * params.quantidade);
  const faturamento = round2(params.precoVenda * params.quantidade);
  const lucroLote = round2(health.lucro * params.quantidade);
  const mesesParaGirar = round2(params.quantidade / Math.max(1, params.giroMensal));
  const retornoSobreEstoque = investimento > 0 ? round2((lucroLote / investimento) * 100) : 0;

  return {
    investimento,
    faturamento,
    lucroLote,
    margem: health.margem,
    mesesParaGirar,
    retornoSobreEstoque,
    parecer:
      retornoSobreEstoque >= 25 && mesesParaGirar <= 2.5
        ? "Compra saudável para acelerar estoque."
        : retornoSobreEstoque >= 15
          ? "Compra possível, mas exige preço certo e controle de frete."
          : "Estoque arriscado: o lucro do lote está baixo para o capital imobilizado.",
    acoes: [
      "Negocie custo unitário antes de comprar alto volume.",
      "Acompanhe giro mensal real para não travar caixa em SKU lento.",
      "Teste versão em kit para reduzir meses de giro e aumentar ROI.",
    ],
  };
}

export function planilhaDiagnostic(rows: Array<{ nome: string; receita: number; custo: number; taxa: number; frete: number }>) {
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
    return { ...row, ...health };
  });

  const campeoes = normalized.filter((r) => r.score >= 75).slice(0, 5);
  const alertas = normalized.filter((r) => r.score < 50).slice(0, 5);
  const resumo = {
    totalProdutos: normalized.length,
    lucroMedio: round2(normalized.reduce((acc, item) => acc + item.lucro, 0) / Math.max(1, normalized.length)),
    margemMedia: round2(normalized.reduce((acc, item) => acc + item.margem, 0) / Math.max(1, normalized.length)),
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





