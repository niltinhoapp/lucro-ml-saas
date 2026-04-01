import { createClient } from "@supabase/supabase-js";

function getSupabaseEnv() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("supabaseUrl is required.");
  }

  if (!supabaseAnonKey) {
    throw new Error("supabaseAnonKey is required.");
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function createSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = createSupabaseClient();
      const value = client[prop as keyof typeof client];
      return typeof value === "function" ? value.bind(client) : value;
    },
  }
) as ReturnType<typeof createSupabaseClient>;




