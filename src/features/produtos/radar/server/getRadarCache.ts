import { createServerClient } from "@/integrations/supabase/server";

type RadarCacheRow = {
  id: string;
  query_normalized: string;
  site_id: string;
  payload: unknown;
  expires_at: string;
  created_at?: string;
  updated_at?: string;
};

function normalizeQuery(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export async function getRadarCache(query: string, siteId = "MLB") {
  const supabase = await createServerClient();
  const queryNormalized = normalizeQuery(query);

  if (!queryNormalized) return null;

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("radar_cache")
    .select(
      "id, query_normalized, site_id, payload, expires_at, created_at, updated_at"
    )
    .eq("query_normalized", queryNormalized)
    .eq("site_id", siteId)
    .gt("expires_at", nowIso)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao consultar radar_cache: ${error.message}`);
  }

  return (data as RadarCacheRow | null) ?? null;
}
