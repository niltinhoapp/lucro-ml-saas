import { createAdminClient } from "@/integrations/supabase/admin";
import { extractLikelyPdfText } from "./pdf";
import { extractCatalogItemsWithAI } from "./ai-extractor";
import { validateAndNormalizeCatalogItems } from "./validator";
import { analyzeCatalogRows } from "./analyzer";

function safePreviewText(text: string) {
  if (!text) return "Nenhum texto legível foi extraído deste arquivo.";
  return text.slice(0, 1500);
}

async function upsertRun(
  catalogId: string,
  userId: string,
  step: "upload" | "parse" | "normalize" | "analyze" | "finalize",
  status: "pending" | "running" | "success" | "error",
  message?: string
) {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("catalog_runs")
    .select("id, logs")
    .eq("catalog_id", catalogId)
    .eq("step", step)
    .maybeSingle();

  const logEntry = message
    ? [{ at: new Date().toISOString(), message }]
    : [];

  if (existing?.id) {
    await admin
      .from("catalog_runs")
      .update({
        status,
        logs: [...(existing.logs || []), ...logEntry],
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    return;
  }

  await admin.from("catalog_runs").insert({
    catalog_id: catalogId,
    user_id: userId,
    step,
    status,
    logs: logEntry,
  });
}

export async function processCatalogById(catalogId: string) {
  const admin = createAdminClient();

  const { data: catalog, error } = await admin
    .from("supplier_catalogs")
    .select("*")
    .eq("id", catalogId)
    .single();

  if (error || !catalog) {
    throw new Error("Catálogo não encontrado.");
  }

  const userId = catalog.user_id as string;
  const bucket = process.env.CATALOG_BUCKET || "catalogs";

  await upsertRun(catalogId, userId, "parse", "running", "Iniciando leitura do arquivo.");

  await admin
    .from("supplier_catalogs")
    .update({
      status: "processing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", catalogId);

  const { data: fileData, error: fileError } = await admin.storage
    .from(bucket)
    .download(catalog.file_path);

  if (fileError || !fileData) {
    await upsertRun(catalogId, userId, "parse", "error", "Falha ao baixar arquivo.");
    await admin
      .from("supplier_catalogs")
      .update({
        status: "error",
        updated_at: new Date().toISOString(),
      })
      .eq("id", catalogId);
    throw new Error("Falha ao baixar arquivo do storage.");
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());

  let text = "";
  if ((catalog.file_name || "").toLowerCase().endsWith(".pdf")) {
    const extracted = await extractLikelyPdfText(buffer);
    text = extracted.text;
  } else {
    text = buffer.toString("utf-8");
  }

  if (!text.trim()) {
    await upsertRun(catalogId, userId, "parse", "error", "Arquivo sem texto legível.");
    await admin
      .from("supplier_catalogs")
      .update({
        status: "error",
        updated_at: new Date().toISOString(),
      })
      .eq("id", catalogId);
    return;
  }

  await upsertRun(catalogId, userId, "parse", "success", "Texto extraído com sucesso.");
  await upsertRun(catalogId, userId, "normalize", "running", "Enviando conteúdo para estruturação.");

  const ai = await extractCatalogItemsWithAI({ extractedText: text });
  const validItems = validateAndNormalizeCatalogItems(ai.items);

  await upsertRun(
    catalogId,
    userId,
    "normalize",
    "success",
    `Itens validados: ${validItems.length}`
  );

  await admin.from("supplier_catalog_items").delete().eq("catalog_id", catalogId);

  if (validItems.length) {
    const itemsPayload = validItems.map((item) => ({
      catalog_id: catalogId,
      user_id: userId,
      raw_name: item.productName,
      normalized_name: item.productName,
      supplier_sku: item.sku,
      brand: item.brand,
      category: item.category,
      supplier_cost: item.supplierCost ?? 0,
      min_qty: item.unitsPerBox,
      unit: item.unitsPerBox ? "caixa" : "un",
      notes: item.notes,
      raw_data: {
        model: item.model,
        unitPrice: item.unitPrice,
        boxPrice: item.boxPrice,
        unitsPerBox: item.unitsPerBox,
        specs: item.specs,
        confidence: item.confidence,
      },
    }));

    const { error: insertItemsError } = await admin
      .from("supplier_catalog_items")
      .insert(itemsPayload);

    if (insertItemsError) throw insertItemsError;
  }

  await upsertRun(catalogId, userId, "analyze", "running", "Calculando análise comercial.");

  const analyzed = analyzeCatalogRows(validItems);

  const { data: catalogItems } = await admin
    .from("supplier_catalog_items")
    .select("id, normalized_name, supplier_sku")
    .eq("catalog_id", catalogId);

  const itemIds = (catalogItems || []).map((x) => x.id);

  if (itemIds.length) {
    await admin.from("catalog_item_analysis").delete().in("item_id", itemIds);
  }

  if (catalogItems?.length) {
    const analysisPayload = analyzed.rows
      .map((row) => {
        const match =
          catalogItems.find(
            (it) =>
              (it.supplier_sku || null) === (row.sku || null) &&
              it.normalized_name === row.productName
          ) ||
          catalogItems.find((it) => it.normalized_name === row.productName);

        if (!match) return null;

        return {
          item_id: match.id,
          user_id: userId,
          ml_search_term: row.productName,
          ml_price_avg: row.mlPriceAvg ?? 0,
          ml_price_min: row.mlPriceMin ?? 0,
          ml_price_max: row.mlPriceMax ?? 0,
          estimated_fees: row.estimatedFees ?? 0,
          estimated_shipping: row.estimatedShipping ?? 0,
          estimated_margin: row.estimatedMargin ?? 0,
          estimated_profit: row.estimatedProfit ?? 0,
          demand_score: row.demandScore ?? 0,
          competition_score: row.competitionScore ?? 0,
          opportunity_score: row.opportunityScore ?? 0,
          risk_level: row.riskLevel,
          analysis: {
            worthBuying: row.worthBuying,
            specs: row.specs,
            notes: row.notes,
          },
          ai_summary: row.aiSummary ?? null,
        };
      })
      .filter(Boolean);

    if (analysisPayload.length) {
      const { error: insertAnalysisError } = await admin
        .from("catalog_item_analysis")
        .insert(analysisPayload);

      if (insertAnalysisError) throw insertAnalysisError;
    }
  }

  const extractedTextPreview = safePreviewText(text);

  await upsertRun(catalogId, userId, "analyze", "success", "Análise concluída.");
  await upsertRun(catalogId, userId, "finalize", "success", "Catálogo finalizado.");

  await admin
    .from("supplier_catalogs")
    .update({
      status: "analyzed",
      items_count: analyzed.rows.length,
      parsed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", catalogId);

  return {
    catalogId,
    summary: {
      ...analyzed.summary,
      extractedTextPreview,
    },
    rows: analyzed.rows,
  };
}