export type EngineInput = {
  produto: string;
  categoria?: string;
  precoVenda: number;
  custoProduto: number;
  frete: number;
  taxaPercent: number;
  devolucaoPercent?: number;
  adsPercent?: number;
  
};

export type EngineResult = {
  score: number;
  margem: number;
  lucro: number;
  status: "excelente" | "atenção" | "risco";
  insights: string[];
  alertas: string[];
  recomendacoes: string[];
  meta: Record<string, any>;

};