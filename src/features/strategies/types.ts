export type StrategySection = {
  title: string;
  text: string;
};

export type Strategy = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  content: StrategySection[];
  estimatedReadMinutes: number;
  planRequired: "free" | "pro" | "plus";
  isRead: boolean;
  readAt: string | null;
};

export type StrategyRecommendation = {
  id: string;
  strategyId: string | null;
  title: string;
  reason: string;
  score: number;
};

export type StrategiesResponse = {
  strategies: Strategy[];
  recommendations: StrategyRecommendation[];
};


