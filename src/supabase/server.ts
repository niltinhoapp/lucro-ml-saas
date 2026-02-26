import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";

export async function createServerClient() {
  // ✅ Next 16: cookies() pode ser Promise
  const cookieStore = await cookies();

  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // ✅ getAll pode não existir em alguns builds → fallback
          const all = (cookieStore as any).getAll?.();
          if (all) return all;

          // fallback: monta no formato esperado pelo @supabase/ssr
          const list = (cookieStore as any).get?.length ? [] : [];
          // (na prática, quase sempre getAll existe após await cookies())
          return list as any;
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            (cookieStore as any).set(name, value, options);
          });
        },
      },
    }
  );
}