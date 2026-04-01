export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createServerClient } from "@/integrations/supabase/server";
import { createAdminClient } from "@/integrations/supabase/admin";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: catalog, error: catalogError } = await admin
      .from("supplier_catalogs")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (catalogError || !catalog) {
      return NextResponse.json({ ok: false, error: "Catálogo não encontrado." }, { status: 404 });
    }

    const { data: items, error: itemsError } = await admin
      .from("supplier_catalog_items")
      .select("*")
      .eq("catalog_id", id);

    if (itemsError) throw itemsError;

    const itemIds = (items || []).map((i) => i.id);

    const { data: analysis, error: analysisError } = itemIds.length
      ? await admin
          .from("catalog_item_analysis")
          .select("*")
          .in("item_id", itemIds)
      : { data: [], error: null };

    if (analysisError) throw analysisError;

    const rows = (items || []).map((item) => {
      const a = (analysis || []).find((x) => x.item_id === item.id);

      return {
        id: item.id,
        sku: item.supplier_sku,
        productName: item.normalized_name || item.raw_name,
        brand: item.brand,
        category: item.category,
        supplierCost: Number(item.supplier_cost || 0),
        unitPrice: item.raw_data?.unitPrice ?? null,
        boxPrice: item.raw_data?.boxPrice ?? null,
        unitsPerBox: item.raw_data?.unitsPerBox ?? null,
        specs: item.raw_data?.specs ?? [],
        confidence: item.raw_data?.confidence ?? null,
        notes: item.notes,
        mlPriceAvg: a?.ml_price_avg ?? null,
        mlPriceMin: a?.ml_price_min ?? null,
        mlPriceMax: a?.ml_price_max ?? null,
        estimatedFees: a?.estimated_fees ?? null,
        estimatedShipping: a?.estimated_shipping ?? null,
        estimatedProfit: a?.estimated_profit ?? null,
        estimatedMargin: a?.estimated_margin ?? null,
        demandScore: a?.demand_score ?? null,
        competitionScore: a?.competition_score ?? null,
        opportunityScore: a?.opportunity_score ?? null,
        riskLevel: a?.risk_level ?? null,
        aiSummary: a?.ai_summary ?? null,
        analysis: a?.analysis ?? {},
      };
    });

    const { data: runs } = await admin
      .from("catalog_runs")
      .select("*")
      .eq("catalog_id", id)
      .order("created_at", { ascending: true });

    return NextResponse.json({
      ok: true,
      catalog,
      rows: rows.sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0)),
      runs: runs || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Falha ao buscar catálogo." },
      { status: 500 }
    );
  }
}




