import { createAdminClient } from "@/lib/supabase/admin";
import { analyzeCatalogBuffer } from "./analyze";

function getPagesCountFromHighlights(highlights?: string[]): number | null {
  if (!Array.isArray(highlights)) return null;

  const line = highlights.find((item) =>
    typeof item === "string" && item.toLowerCase().includes("páginas lidas no pdf:")
  );

  if (!line) return null;

  const match = line.match(/(\d+)/);
  if (!match) return null;

  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function getInputTokens(summary: any): number | null {
  return typeof summary?.inputTokens === "number" ? summary.inputTokens : null;
}

function getOutputTokens(summary: any): number | null {
  return typeof summary?.outputTokens === "number" ? summary.outputTokens : null;
}

export async function processCatalogJob(jobId: string) {
  const admin = createAdminClient();

  const { data: job, error: jobError } = await admin
    .from("catalog_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    throw new Error(`Job não encontrado: ${jobId}`);
  }

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

  const bucket = process.env.CATALOG_BUCKET || "catalogs";

  const { data: fileData, error: fileError } = await admin.storage
    .from(bucket)
    .download(job.storage_path);

  if (fileError || !fileData) {
    await admin
      .from("catalog_jobs")
      .update({
        status: "failed",
        error_message: "Falha ao baixar arquivo do storage.",
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    throw new Error("Falha ao baixar arquivo do storage.");
  }

  try {
    const buffer = Buffer.from(await fileData.arrayBuffer());

    const fileName =
      job.file_name ||
      job.original_file_name ||
      job.title ||
      "catalogo.pdf";

    const analyzed = await analyzeCatalogBuffer(fileName, buffer);

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

      const { error: insertError } = await admin
        .from("catalog_rows")
        .insert(rowsPayload);

      if (insertError) {
        throw new Error(`Falha ao inserir catalog_rows: ${insertError.message}`);
      }
    }

    const pagesCount = getPagesCountFromHighlights(analyzed.aiSummary?.highlights);

    await admin
      .from("catalog_jobs")
      .update({
        status: analyzed.rows.length ? "completed" : "manual_review",
        pages_count: pagesCount,
        extracted_text_preview:
          analyzed.aiSummary?.extractedTextPreview ||
          "Nenhum texto legível foi extraído deste arquivo.",
        analysis_summary: analyzed.aiSummary,
        input_tokens: getInputTokens(analyzed.aiSummary),
        output_tokens: getOutputTokens(analyzed.aiSummary),
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        error_message:
          analyzed.rows.length > 0
            ? null
            : "Arquivo processado, mas sem itens estruturados suficientes.",
      })
      .eq("id", jobId);
  } catch (error) {
    console.error("[processCatalogJob] erro:", error);

    await admin
      .from("catalog_jobs")
      .update({
        status: "failed",
        error_message:
          error instanceof Error ? error.message : "Falha ao processar catálogo.",
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    throw error;
  }
}