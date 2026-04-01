import { createAdminClient } from "@/integrations/supabase/admin";
import { extractLikelyPdfText } from "./pdf";
import { extractCatalogItemsWithAI } from "./ai-extractor";
import { validateAndNormalizeCatalogItems } from "./validator";
import { analyzeCatalogRows } from "./analyzer";

function safePreviewText(text: string) {
  if (!text) {
    return "Nenhum texto legível foi extraído deste arquivo.";
  }
  return text.slice(0, 1500);
}

export async function processCatalogJob(jobId: string) {
  const admin = createAdminClient();

  const { data: job, error: jobError } = await admin
    .from("catalog_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  const bucket = process.env.CATALOG_BUCKET || "catalogs";

  await admin
    .from("catalog_jobs")
    .update({
      status: "processing",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", jobId)
    .eq("status", "queued");

  const { data: fileData, error: fileError } = await admin.storage
    .from(bucket)
    .download(job.storage_path);

  if (fileError || !fileData) {
    await admin.from("catalog_jobs").update({
      status: "failed",
      error_message: "Falha ao baixar arquivo do storage.",
      finished_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);

    throw new Error("Storage download failed");
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const { text, pages } = await extractLikelyPdfText(buffer);

  if (!text) {
    await admin.from("catalog_jobs").update({
      status: "failed",
      pages_count: pages,
      extracted_text_preview: "Nenhum texto legível foi extraído deste arquivo.",
      error_message: "PDF sem texto legível. Pode precisar de OCR.",
      finished_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);

    return;
  }

  const ai = await extractCatalogItemsWithAI({ extractedText: text });
  const validItems = validateAndNormalizeCatalogItems(ai.items);
  const analyzed = analyzeCatalogRows(validItems);

  await admin.from("catalog_rows").delete().eq("job_id", jobId);

  if (analyzed.rows.length) {
    const rowsPayload = analyzed.rows.map((row) => ({
      job_id: jobId,
      sku: row.sku,
      model: row.model,
      brand: row.brand,
      category: row.category,
      product_name: row.productName,
      supplier_cost: row.supplierCost,
      unit_price: row.unitPrice,
      box_price: row.boxPrice,
      units_per_box: row.unitsPerBox,
      specs: row.specs,
      notes: row.notes,
      risk_level: row.riskLevel,
      worth_buying: row.worthBuying,
      ml_price_avg: row.mlPriceAvg,
      ml_price_min: row.mlPriceMin,
      ml_price_max: row.mlPriceMax,
      estimated_fees: row.estimatedFees,
      estimated_shipping: row.estimatedShipping,
      estimated_profit: row.estimatedProfit,
      estimated_margin: row.estimatedMargin,
      demand_score: row.demandScore,
      competition_score: row.competitionScore,
      opportunity_score: row.opportunityScore,
      ai_summary: row.aiSummary,
    }));

    const { error: insertError } = await admin.from("catalog_rows").insert(rowsPayload);
    if (insertError) {
      throw insertError;
    }
  }

  analyzed.summary.extractedTextPreview = safePreviewText(text);

  await admin.from("catalog_jobs").update({
    status: "completed",
    pages_count: pages,
    extracted_text_preview: analyzed.summary.extractedTextPreview,
    analysis_summary: analyzed.summary,
    input_tokens: ai.inputTokens ?? null,
    output_tokens: ai.outputTokens ?? null,
    finished_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", jobId);
}

