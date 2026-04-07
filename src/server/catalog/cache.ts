import { createServerClient } from "@/integrations/supabase/server";

const DEFAULT_VERSION = "v1";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

export type CatalogAiCacheRow = {
  id: string;
  cache_key: string;
  version: string;
  model: string | null;
  extracted_text: string | null;
  structured_json: JsonValue;
  items_count: number;
  input_tokens: number | null;
  output_tokens: number | null;
  created_at: string;
  updated_at: string;
};

type SaveCatalogAiCacheInput = {
  cacheKey: string;
  version?: string;
  model?: string | null;
  extractedText?: string | null;
  structuredJson: JsonValue;
  itemsCount: number;
  inputTokens?: number | null;
  outputTokens?: number | null;
};

type GetOrSetCatalogAiCacheFactoryResult = {
  model?: string | null;
  extractedText?: string | null;
  structuredJson: JsonValue;
  itemsCount: number;
  inputTokens?: number | null;
  outputTokens?: number | null;
};

type GetOrSetCatalogAiCacheInput = {
  cacheKey: string;
  version?: string;
  factory: () => Promise<GetOrSetCatalogAiCacheFactoryResult>;
};

export type GetOrSetCatalogAiCacheResult = {
  data: CatalogAiCacheRow | null;
  fromCache: boolean;
};

function normalizeCacheKey(cacheKey: string) {
  return String(cacheKey || "").trim();
}

function normalizeVersion(version?: string) {
  return String(version || DEFAULT_VERSION).trim() || DEFAULT_VERSION;
}

function normalizeNullableText(value?: string | null) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function isValidItemsCount(value: number) {
  return Number.isFinite(value) && value >= 0;
}

async function getCatalogCacheTable() {
  const supabase = await createServerClient();
  return supabase.from("catalog_ai_cache");
}

export async function getCatalogAiCache(
  cacheKey: string,
  version = DEFAULT_VERSION
): Promise<CatalogAiCacheRow | null> {
  const normalizedCacheKey = normalizeCacheKey(cacheKey);
  const normalizedVersion = normalizeVersion(version);

  if (!normalizedCacheKey) {
    return null;
  }

  const table = await getCatalogCacheTable();

  const { data, error } = await table
    .select("*")
    .eq("cache_key", normalizedCacheKey)
    .eq("version", normalizedVersion)
    .maybeSingle();

  if (error) {
    console.error("[catalog/cache] erro ao buscar cache:", {
      message: error.message,
      cacheKey: normalizedCacheKey,
      version: normalizedVersion,
    });
    return null;
  }

  return (data ?? null) as CatalogAiCacheRow | null;
}

export async function saveCatalogAiCache(
  input: SaveCatalogAiCacheInput
): Promise<CatalogAiCacheRow | null> {
  const normalizedCacheKey = normalizeCacheKey(input.cacheKey);
  const normalizedVersion = normalizeVersion(input.version);

  if (!normalizedCacheKey) {
    console.error("[catalog/cache] cacheKey ausente ao salvar cache");
    return null;
  }

  if (!isValidItemsCount(input.itemsCount)) {
    console.error("[catalog/cache] itemsCount inválido ao salvar cache", {
      itemsCount: input.itemsCount,
      cacheKey: normalizedCacheKey,
      version: normalizedVersion,
    });
    return null;
  }

  const payload = {
    cache_key: normalizedCacheKey,
    version: normalizedVersion,
    model: normalizeNullableText(input.model),
    extracted_text: normalizeNullableText(input.extractedText),
    structured_json: input.structuredJson,
    items_count: input.itemsCount,
    input_tokens: input.inputTokens ?? null,
    output_tokens: input.outputTokens ?? null,
  };

  const table = await getCatalogCacheTable();

  const { data, error } = await table
    .upsert(payload, { onConflict: "cache_key,version" })
    .select("*")
    .single();

  if (error) {
    console.error("[catalog/cache] erro ao salvar cache:", {
      message: error.message,
      cacheKey: normalizedCacheKey,
      version: normalizedVersion,
    });
    return null;
  }

  return data as CatalogAiCacheRow;
}

export async function deleteCatalogAiCache(
  cacheKey: string,
  version = DEFAULT_VERSION
): Promise<boolean> {
  const normalizedCacheKey = normalizeCacheKey(cacheKey);
  const normalizedVersion = normalizeVersion(version);

  if (!normalizedCacheKey) {
    console.error("[catalog/cache] cacheKey ausente ao deletar cache");
    return false;
  }

  const table = await getCatalogCacheTable();

  const { error } = await table
    .delete()
    .eq("cache_key", normalizedCacheKey)
    .eq("version", normalizedVersion);

  if (error) {
    console.error("[catalog/cache] erro ao deletar cache:", {
      message: error.message,
      cacheKey: normalizedCacheKey,
      version: normalizedVersion,
    });
    return false;
  }

  return true;
}

export async function getOrSetCatalogAiCache(
  input: GetOrSetCatalogAiCacheInput
): Promise<GetOrSetCatalogAiCacheResult> {
  const normalizedCacheKey = normalizeCacheKey(input.cacheKey);
  const normalizedVersion = normalizeVersion(input.version);

  if (!normalizedCacheKey) {
    console.error("[catalog/cache] cacheKey ausente no getOrSet");
    return {
      data: null,
      fromCache: false,
    };
  }

  const cached = await getCatalogAiCache(
    normalizedCacheKey,
    normalizedVersion
  );

  if (cached) {
    return {
      data: cached,
      fromCache: true,
    };
  }

  let created: GetOrSetCatalogAiCacheFactoryResult;

  try {
    created = await input.factory();
  } catch (error) {
    console.error("[catalog/cache] erro na factory do getOrSet:", {
      cacheKey: normalizedCacheKey,
      version: normalizedVersion,
      error,
    });

    return {
      data: null,
      fromCache: false,
    };
  }

  const saved = await saveCatalogAiCache({
    cacheKey: normalizedCacheKey,
    version: normalizedVersion,
    model: created.model ?? null,
    extractedText: created.extractedText ?? null,
    structuredJson: created.structuredJson,
    itemsCount: created.itemsCount,
    inputTokens: created.inputTokens ?? null,
    outputTokens: created.outputTokens ?? null,
  });

  return {
    data: saved,
    fromCache: false,
  };
}
