import { createServerClient } from "@/integrations/supabase/server";

export type GeneratedRadarRecommendation = {
  strategyId: string | null;
  strategySlug: string | null;
  title: string;
  reason: string;
  score: number;
};

type GenerateRadarRecommendationInput = {
  userId: string;
  query: string;
  opportunityScore: number;
  demandScore: number;
  competitionScore: number;
};

function chooseStrategySlug(input: GenerateRadarRecommendationInput) {
  const { opportunityScore, demandScore, competitionScore } = input;

  if (opportunityScore >= 75 && competitionScore <= 55) {
    return {
      slug: "dominio-de-categoria",
      fallbackTitle: "Domínio de Categoria",
      score: 92,
    };
  }

  if (demandScore >= 70 && competitionScore >= 70) {
    return {
      slug: "preco-ancora",
      fallbackTitle: "Preço Âncora",
      score: 88,
    };
  }

  if (opportunityScore >= 55) {
    return {
      slug: "escada-de-preco",
      fallbackTitle: "Escada de Preço",
      score: 81,
    };
  }

  return {
    slug: "subsidio-de-campanha",
    fallbackTitle: "Subsídio de Campanha",
    score: 72,
  };
}

function buildReason(input: GenerateRadarRecommendationInput, title: string) {
  const { query, opportunityScore, demandScore, competitionScore } = input;

  if (title === "Domínio de Categoria") {
    return `O radar encontrou espaço real em "${query}", com oportunidade ${opportunityScore}/100 e concorrência controlada. Faz sentido ampliar presença no nicho com cobertura mais estratégica.`;
  }

  if (title === "Preço Âncora") {
    return `A busca por "${query}" mostra demanda forte (${demandScore}/100) em ambiente competitivo (${competitionScore}/100). A estratégia de preço âncora ajuda a competir sem pressionar tanto a margem.`;
  }

  if (title === "Escada de Preço") {
    return `O nicho "${query}" aparece com oportunidade moderada (${opportunityScore}/100). Ajustes progressivos de preço podem validar tração com menos risco.`;
  }

  return `A oportunidade em "${query}" ainda pede cautela. Antes de escalar, vale usar campanhas e incentivos com proteção de margem.`;
}

export async function generateRadarRecommendation(
  input: GenerateRadarRecommendationInput
): Promise<GeneratedRadarRecommendation> {
  const supabase = await createServerClient();

  const choice = chooseStrategySlug(input);

  const { data: strategy } = await supabase
    .from("strategies")
    .select("id, slug, title")
    .eq("slug", choice.slug)
    .limit(1)
    .maybeSingle();

  const title = strategy?.title ?? choice.fallbackTitle;

  return {
    strategyId: strategy?.id ?? null,
    strategySlug: strategy?.slug ?? choice.slug,
    title,
    reason: buildReason(input, title),
    score: choice.score,
  };
}


