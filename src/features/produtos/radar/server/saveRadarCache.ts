import { createServerClient } from "@/integrations/supabase/server";

type SaveRadarCacheInput = {
  query: string;
  siteId?: string;
  payload: unknown;
  ttlMinutes?: number;
};

function normalizeQuery(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export async function saveRadarCache({
  query,
  siteId = "MLB",
  payload,
  ttlMinutes = 60,
}: SaveRadarCacheInput) {
  const supabase = await createServerClient();

  const queryNormalized = normalizeQuery(query);
  if (!queryNormalized) {
    throw new Error("query é obrigatória para salvar radar_cache.");
  }

  const expiresAt = new Date(
    Date.now() + ttlMinutes * 60 * 1000
  ).toISOString();

  const row = {
    query_normalized: queryNormalized,
    site_id: siteId,
    payload: payload ?? {},
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("radar_cache")
    .upsert(row, {
      onConflict: "query_normalized,site_id",
    });

  if (error) {
    throw new Error(`Falha ao salvar radar_cache: ${error.message}`);
  }

  return row;
}
