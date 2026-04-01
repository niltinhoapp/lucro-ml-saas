import { createServerClient } from "@/integrations/supabase/server";

type CatalogAiCacheRow = {
  id: string;
  cache_key: string;
  version: string;
  model: string | null;
  extracted_text: string | null;
  structured_json: any;
  items_count: number;
  input_tokens: number | null;
  output_tokens: number | null;
  created_at: string;
  updated_at: string;
};

const DEFAULT_VERSION = "v1";

export async function getCatalogAiCache(
  cacheKey: string,
  version = DEFAULT_VERSION
) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("catalog_ai_cache")
    .select("*")
    .eq("cache_key", cacheKey)
    .eq("version", version)
    .maybeSingle();

  if (error) {
    console.error("[catalog/cache] erro ao buscar cache:", error.message);
    return null;
  }

  return (data ?? null) as CatalogAiCacheRow | null;
}

export async function saveCatalogAiCache(input: {
  cacheKey: string;
  version?: string;
  model?: string | null;
  extractedText?: string | null;
  structuredJson: unknown;
  itemsCount: number;
  inputTokens?: number | null;
  outputTokens?: number | null;
}) {
  const supabase = await createServerClient();

  const payload = {
    cache_key: input.cacheKey,
    version: input.version ?? DEFAULT_VERSION,
    model: input.model ?? null,
    extracted_text: input.extractedText ?? null,
    structured_json: input.structuredJson,
    items_count: input.itemsCount,
    input_tokens: input.inputTokens ?? null,
    output_tokens: input.outputTokens ?? null,
  };

  const { data, error } = await supabase
    .from("catalog_ai_cache")
    .upsert(payload, { onConflict: "cache_key,version" })
    .select()
    .single();

  if (error) {
    console.error("[catalog/cache] erro ao salvar cache:", error.message);
    return null;
  }

  return data as CatalogAiCacheRow;
}

