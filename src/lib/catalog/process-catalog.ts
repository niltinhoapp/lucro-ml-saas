import { createAdminClient } from "@/lib/supabase/admin";
import { analyzeCatalogBuffer } from "./analyze";

type RunStep = "upload" | "parse" | "normalize" | "analyze" | "finalize";
type RunStatus = "pending" | "running" | "success" | "error";

function safePreviewText(text: string) {
  if (!text) {
    return "Nenhum texto legível foi extraído deste arquivo.";
  }

  return text.slice(0, 1500);
}

async function upsertRun(
  catalogId: string,
  userId: string,
  step: RunStep,
  status: RunStatus,
  message?: string
) {
  const admin = createAdminClient();

  const { data: existing, error: existingError } = await admin
    .from("catalog_runs")
    .select("id, logs")
    .eq("catalog_id", catalogId)
    .eq("step", step)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      `Falha ao consultar catalog_runs (${step}): ${existingError.message}`
    );
  }

  const logEntry = message
    ? [{ at: new Date().toISOString(), message }]
    : [];

  if (existing?.id) {
    const { error: updateError } = await admin
      .from("catalog_runs")
      .update({
        status,
        logs: [...(existing.logs || []), ...logEntry],
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) {
      throw new Error(
        `Falha ao atualizar catalog_runs (${step}): ${updateError.message}`
      );
    }

    return;
  }

  const { error: insertError } = await admin.from("catalog_runs").insert({
    catalog_id: catalogId,
    user_id: userId,
    step,
    status,
    logs: logEntry,
  });

  if (insertError) {
    throw new Error(
      `Falha ao inserir catalog_runs (${step}): ${insertError.message}`
    );
  }
}

async function setCatalogStatus(
  catalogId: string,
  status: string,
  extra: Record<string, unknown> = {}
) {
  const admin = createAdminClient();

  const payload = {
    status,
    updated_at: new Date().toISOString(),
    ...extra,
  };

  const { error } = await admin
    .from("supplier_catalogs")
    .update(payload)
    .eq("id", catalogId);

  if (error) {
    throw new Error(`Falha ao atualizar supplier_catalogs: ${error.message}`);
  }
}

export async function processCatalogById(catalogId: string) {
  const admin = createAdminClient();

  const { data: catalog, error: catalogError } = await admin
    .from("supplier_catalogs")
    .select("*")
    .eq("id", catalogId)
    .single();

  if (catalogError || !catalog) {
    throw new Error("Catálogo não encontrado.");
  }

  const userId = String(catalog.user_id);
  const bucket = process.env.CATALOG_BUCKET || "catalogs";

  try {
    await upsertRun(
      catalogId,
      userId,
      "parse",
      "running",
      "Iniciando leitura e interpretação do arquivo."
    );

    await setCatalogStatus(catalogId, "processing");

    const { data: fileData, error: fileError } = await admin.storage
      .from(bucket)
      .download(catalog.file_path);

    if (fileError || !fileData) {
      await upsertRun(
        catalogId,
        userId,
        "parse",
        "error",
        "Falha ao baixar arquivo."
      );

      await setCatalogStatus(catalogId, "error");

      throw new Error("Falha ao baixar arquivo do storage.");
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    const fileName =
      catalog.file_name ||
      catalog.original_file_name ||
      catalog.title ||
      "catalogo.pdf";

    const analyzedResult = await analyzeCatalogBuffer(fileName, buffer);

    const previewText = safePreviewText(
      analyzedResult.aiSummary?.extractedTextPreview || ""
    );

    const highlights = Array.isArray(analyzedResult.aiSummary?.highlights)
      ? analyzedResult.aiSummary.highlights
      : [];

    await upsertRun(
      catalogId,
      userId,
      "parse",
      analyzedResult.rows.length ? "success" : "error",
      analyzedResult.rows.length
        ? "Arquivo interpretado com sucesso."
        : "Nenhum item estruturado encontrado no arquivo."
    );

    await upsertRun(
      catalogId,
      userId,
      "normalize",
      analyzedResult.rows.length ? "success" : "error",
      analyzedResult.rows.length
        ? `Itens estruturados: ${analyzedResult.rows.length}`
        : "Não foi possível estruturar itens válidos."
    );

    if (!analyzedResult.rows.length) {
      await upsertRun(
        catalogId,
        userId,
        "finalize",
        "error",
        "Processamento concluído sem itens aproveitáveis."
      );

      await setCatalogStatus(catalogId, "error", {
        extracted_text_preview: previewText,
      });

      return;
    }

    await admin
      .from("supplier_catalog_items")
      .delete()
      .eq("catalog_id", catalogId);

    const itemsPayload = analyzedResult.rows.map((row) => ({
      catalog_id: catalogId,
      user_id: userId,
      raw_name: row.productName,
      normalized_name: row.productName,
      supplier_sku: row.sku,
      brand: row.brand,
      category: row.category,
      supplier_cost: row.supplierCost ?? 0,
      min_qty: row.unitsPerBox,
      unit: row.unitsPerBox && row.unitsPerBox > 1 ? "caixa" : "un",
      notes: row.notes,
      raw_data: {
        model: row.model,
        unitPrice: row.unitPrice,
        boxPrice: row.boxPrice,
        unitsPerBox: row.unitsPerBox,
        specs: row.specs,
        aiSummary: row.aiSummary,
      },
    }));

    if (itemsPayload.length) {
      const { error: insertItemsError } = await admin
        .from("supplier_catalog_items")
        .insert(itemsPayload);

      if (insertItemsError) {
        throw new Error(
          `Falha ao inserir supplier_catalog_items: ${insertItemsError.message}`
        );
      }
    }

    await upsertRun(
      catalogId,
      userId,
      "analyze",
      "running",
      "Calculando análise comercial."
    );

    const { data: insertedItems, error: insertedItemsError } = await admin
      .from("supplier_catalog_items")
      .select("id, normalized_name, supplier_sku")
      .eq("catalog_id", catalogId);

    if (insertedItemsError) {
      throw new Error(
        `Falha ao consultar supplier_catalog_items: ${insertedItemsError.message}`
      );
    }

    const itemIds = (insertedItems || []).map((item) => item.id);

    if (itemIds.length) {
      const { error: deleteAnalysisError } = await admin
        .from("catalog_item_analysis")
        .delete()
        .in("item_id", itemIds);

      if (deleteAnalysisError) {
        throw new Error(
          `Falha ao limpar catalog_item_analysis: ${deleteAnalysisError.message}`
        );
      }
    }

    if (insertedItems?.length) {
      const analysisPayload = analyzedResult.rows
        .map((row) => {
          const match =
            insertedItems.find(
              (item) =>
                (item.supplier_sku || null) === (row.sku || null) &&
                item.normalized_name === row.productName
            ) ||
            insertedItems.find(
              (item) => item.normalized_name === row.productName
            );

          if (!match) {
            return null;
          }

          return {
            item_id: match.id,
            user_id: userId,
            ml_search_term: row.productName,
            ml_price_avg: row.mlPriceAvg,
            ml_price_min: row.mlPriceMin,
            ml_price_max: row.mlPriceMax,
            estimated_fees: row.estimatedFees,
            estimated_shipping: row.estimatedShipping,
            estimated_margin: row.estimatedMargin,
            estimated_profit: row.estimatedProfit,
            demand_score: row.demandScore,
            competition_score: row.competitionScore,
            opportunity_score: row.opportunityScore,
            risk_level: row.riskLevel,
            analysis: {
              worthBuying: row.worthBuying,
              specs: row.specs,
              notes: row.notes,
            },
            ai_summary: row.aiSummary,
          };
        })
        .filter(Boolean);

      if (analysisPayload.length) {
        const { error: insertAnalysisError } = await admin
          .from("catalog_item_analysis")
          .insert(analysisPayload);

        if (insertAnalysisError) {
          throw new Error(
            `Falha ao inserir catalog_item_analysis: ${insertAnalysisError.message}`
          );
        }
      }
    }

    await upsertRun(
      catalogId,
      userId,
      "analyze",
      "success",
      `Análise concluída com ${analyzedResult.rows.length} itens.`
    );

    await upsertRun(
      catalogId,
      userId,
      "finalize",
      "success",
      analyzedResult.aiSummary?.usedAI
        ? "Catálogo finalizado com apoio de IA."
        : "Catálogo finalizado com fallback local."
    );

    await setCatalogStatus(catalogId, "analyzed", {
      items_count: analyzedResult.rows.length,
      parsed_at: new Date().toISOString(),
      extracted_text_preview: previewText,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao processar catálogo.";

    try {
      await upsertRun(
        catalogId,
        userId,
        "finalize",
        "error",
        message
      );
    } catch (runError) {
      console.error("[processCatalogById] erro ao registrar catalog_runs:", runError);
    }

    try {
      await setCatalogStatus(catalogId, "error");
    } catch (catalogStatusError) {
      console.error(
        "[processCatalogById] erro ao atualizar supplier_catalogs:",
        catalogStatusError
      );
    }

    throw error;
  }
}