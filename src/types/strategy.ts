export type UserPlan = "plus" | "pro";

export type StrategyCategory =
  | "Precificação"
  | "Promoções"
  | "Ranking"
  | "Escala"
  | "Conversão";

export type Strategy = {
  id: string;
  title: string;
  slug: string;
  category: StrategyCategory;
  readTime: string;
  isNew: boolean;
  isRead: boolean;
  summary: string;
  weekLabel?: string;
  accessLevel: UserPlan;
  content: {
    oQueE: string;
    comoFunciona: string;
    exemplo: string;
    quandoUsar: string;
    erroComum: string;
    acaoDaSemana: string;
  };
};

export const STRATEGY_FILTERS = [
  "Todas",
  "Novas",
  "Lidas",
  "Precificação",
  "Promoções",
  "Ranking",
  "Escala",
  "Conversão",
] as const;

export type StrategyFilter = (typeof STRATEGY_FILTERS)[number];
