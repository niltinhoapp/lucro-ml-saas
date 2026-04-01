export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/integrations/supabase/admin";
import { processCatalogById } from "@/lib/catalog/process-catalog";

export async function POST(req: Request) {
  const secret = req.headers.get("x-catalog-worker-secret");
  if (!secret || secret !== process.env.CATALOG_WORKER_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: catalogs, error } = await admin
    .from("supplier_catalogs")
    .select("id")
    .eq("status", "uploaded")
    .order("created_at", { ascending: true })
    .limit(3);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const results: Array<{ catalogId: string; ok: boolean; error?: string }> = [];

  for (const catalog of catalogs || []) {
    try {
      await processCatalogById(catalog.id);
      results.push({ catalogId: catalog.id, ok: true });
    } catch (error: any) {
      await admin
        .from("supplier_catalogs")
        .update({
          status: "error",
          updated_at: new Date().toISOString(),
        })
        .eq("id", catalog.id);

      results.push({
        catalogId: catalog.id,
        ok: false,
        error: error?.message || "Falha no processamento",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    results,
  });
}




