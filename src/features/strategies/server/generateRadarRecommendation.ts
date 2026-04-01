import { createServerClient } from "@/integrations/supabase/server";

type GenerateRadarRecommendationInput = {
  userId: string;
  query: string;
  opportunityScore: number;
  demandScore: number;
  competitionScore: number;
};

function chooseReason(input: GenerateRadarRecommendationInput) {
  const { opportunityScore, demandScore, competitionScore, query } = input;

  if (opportunityScore >= 75 && competitionScore <= 55) {
    return {
      strategySlug: "dominio-de-categoria",
      reason: `O radar identificou boa oportunidade em "${query}", com concorrência controlada e espaço para escalar presença.`,
      score: 92,
    };
  }

  if (demandScore >= 70 && competitionScore >= 70) {
    return {
      strategySlug: "preco-ancora",
      reason: `A busca por "${query}" mostra demanda forte em ambiente competitivo. A estratégia de preço âncora pode proteger margem sem perder tração.`,
      score: 88,
    };
  }

  if (opportunityScore >= 55) {
    return {
      strategySlug: "escada-de-preco",
      reason: `O nicho "${query}" parece promissor, mas exige ajustes finos. A escada de preço pode ajudar a ganhar tração sem sacrificar resultado.`,
      score: 81,
    };
  }

  return {
    strategySlug: "subsidio-de-campanha",
    reason: `A oportunidade em "${query}" ainda pede cautela. Vale priorizar estratégia de campanha com proteção de margem antes de escalar.`,
    score: 72,
  };
}

export async function generateRadarRecommendation(
  input: GenerateRadarRecommendationInput
) {
  const supabase = await createServerClient();

  const choice = chooseReason(input);

  const { data: strategy, error: strategyError } = await supabase
    .from("strategies")
    .select("id, title")
    .eq("slug", choice.strategySlug)
    .single();

  if (strategyError || !strategy) {
    throw strategyError ?? new Error("Strategy not found.");
  }

  const { error } = await supabase.from("strategy_recommendations").insert({
    user_id: input.userId,
    strategy_id: strategy.id,
    reason: choice.reason,
    score: choice.score,
    source: "radar",
  });

  if (error) {
    throw error;
  }

  return strategy;
}