export type CompetitionEntry = {
  seller: string;
  price: number;
  rating: string;
  sold: number;
  activeAds: number;
  shipping: "full" | "flex" | "normal";
};

export type MarketAnalysis = {
  query: string;
  category: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  activeAds: number;
  saturation: "baixa" | "média" | "alta";
  trend: "subindo" | "estável" | "quente";
  opportunityScore: number;
  estimatedMargin: number;
  priceSuggestion: number;
  competitions: CompetitionEntry[];
  summary: string[];
};

export type TrendItem = {
  term: string;
  category: string;
  growth: string;
  competition: "baixa" | "média" | "alta";
  marginPotential: "boa" | "média" | "pressionada";
};

export type BestsellerItem = {
  category: string;
  items: string[];
};

const sellers = [
  "Loja Prime Brasil",
  "Full Center",
  "Top Oferta Store",
  "Casa do Seller",
  "Mega Compra Oficial",
  "Oferta Turbo",
  "Loja Campeã",
  "Max Vendas BR",
];

const trendItems: TrendItem[] = [
  { term: "escova secadora profissional", category: "Beleza", growth: "+31%", competition: "média", marginPotential: "boa" },
  { term: "mini projetor portátil", category: "Eletrônicos", growth: "+42%", competition: "média", marginPotential: "boa" },
  { term: "camera veicular 4k", category: "Automotivo", growth: "+28%", competition: "baixa", marginPotential: "boa" },
  { term: "organizador de cozinha retrátil", category: "Casa", growth: "+19%", competition: "baixa", marginPotential: "média" },
  { term: "aspirador portátil carro", category: "Automotivo", growth: "+24%", competition: "média", marginPotential: "média" },
  { term: "fone bluetooth gamer", category: "Eletrônicos", growth: "+15%", competition: "alta", marginPotential: "pressionada" },
];

const bestsellers: BestsellerItem[] = [
  { category: "Eletrônicos", items: ["mini projetor portátil", "fone bluetooth gamer", "smartwatch tela amoled"] },
  { category: "Casa", items: ["escova secadora profissional", "organizadores modulares", "air fryer 5l"] },
  { category: "Automotivo", items: ["camera veicular 4k", "aspirador portátil carro", "suporte magnético painel"] },
  { category: "Ferramentas", items: ["parafusadeira sem fio", "lixadeira orbital", "kit brocas titânio"] },
];

function hashString(input: string) {
  return input
    .split("")
    .reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 1), 0);
}

function guessCategory(query: string) {
  const value = query.toLowerCase();
  if (value.includes("air fryer") || value.includes("cozinha") || value.includes("escova")) return "Casa";
  if (value.includes("fone") || value.includes("smart") || value.includes("projetor")) return "Eletrônicos";
  if (value.includes("camera") || value.includes("carro") || value.includes("painel")) return "Automotivo";
  if (value.includes("broca") || value.includes("parafusadeira")) return "Ferramentas";
  return "Mercado Livre";
}

export function getTrendItems() {
  return trendItems;
}

export function getBestsellers() {
  return bestsellers;
}

export function createMarketAnalysis(rawQuery: string): MarketAnalysis {
  const query = rawQuery.trim() || "mini projetor portátil";
  const hash = hashString(query);
  const category = guessCategory(query);

  const avgPrice = 69 + (hash % 380);
  const minPrice = Math.max(29, Math.round(avgPrice * 0.82));
  const maxPrice = Math.round(avgPrice * 1.24);
  const activeAds = 18 + (hash % 210);
  const estimatedMargin = 12 + (hash % 24);
  const opportunityScore = Math.max(
    48,
    Math.min(96, Math.round(100 - activeAds / 4 + estimatedMargin * 1.8 + (hash % 8))),
  );
  const priceSuggestion = Math.round(avgPrice * 0.98);

  const saturation: MarketAnalysis["saturation"] =
    activeAds > 130 ? "alta" : activeAds > 70 ? "média" : "baixa";

  const trend: MarketAnalysis["trend"] =
    opportunityScore >= 84 ? "quente" : opportunityScore >= 70 ? "subindo" : "estável";

  const competitions = Array.from({ length: 5 }).map((_, index) => {
    const diff = ((hash + index * 17) % 39) - 19;
    return {
      seller: sellers[(hash + index) % sellers.length],
      price: Math.max(19, avgPrice + diff),
      rating: ["Mercado Líder Platinum", "Mercado Líder Gold", "Boa reputação"][index % 3],
      sold: 90 + ((hash + index * 71) % 2100),
      activeAds: 2 + ((hash + index * 5) % 17),
      shipping: (["full", "flex", "normal"] as const)[(hash + index) % 3],
    };
  });

  const summary = [
    `Preço médio estimado em R$ ${avgPrice.toFixed(2)} com faixa principal entre R$ ${minPrice.toFixed(2)} e R$ ${maxPrice.toFixed(2)}.`,
    `Existem ${activeAds} anúncios ativos para "${query}", indicando saturação ${saturation}.`,
    `A margem estimada para operação saudável fica em torno de ${estimatedMargin}% se custo e frete estiverem sob controle.`,
    opportunityScore >= 80
      ? "Há boa chance de entrada se o anúncio tiver diferenciação, oferta clara e controle de taxa/logística."
      : "Antes de entrar, valide custo, ticket e reputação da concorrência porque a pressão competitiva está mais forte.",
  ];

  return {
    query,
    category,
    avgPrice,
    minPrice,
    maxPrice,
    activeAds,
    saturation,
    trend,
    opportunityScore,
    estimatedMargin,
    priceSuggestion,
    competitions,
    summary,
  };
}

