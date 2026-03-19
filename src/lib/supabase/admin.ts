import { createClient } from "@supabase/supabase-js";

function getAdminEnv() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return { supabaseUrl, serviceRoleKey };
}

export function createAdminClient() {
  const { supabaseUrl, serviceRoleKey } = getAdminEnv();

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const supabaseAdmin = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = createAdminClient();
      const value = client[prop as keyof typeof client];
      return typeof value === "function" ? value.bind(client) : value;
    },
  }
) as ReturnType<typeof createAdminClient>;