import { NextResponse } from "next/server";
import { analyzeCatalogBuffer } from "@/lib/catalog/analyze";
import { createServerClient } from "@/integrations/supabase/server";
import { getEntitlements } from "@/integrations/supabase/entitlements";

export const runtime = "nodejs";

export async function POST(req: Request) {
  console.log("==================================================");
  console.log("[api/catalogos/analisar] POST iniciado");

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    console.log("[api/catalogos/analisar] file recebido?", !!file);

    if (!(file instanceof File)) {
      console.error("[api/catalogos/analisar] arquivo ausente ou inválido");
      return NextResponse.json(
        { error: "Arquivo não enviado corretamente." },
        { status: 400 }
      );
    }

    const fileName = file.name || "catalogo.pdf";
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log("[api/catalogos/analisar] fileName:", fileName);
    console.log("[api/catalogos/analisar] buffer.length:", buffer.length);

    if (!buffer.length) {
      console.error("[api/catalogos/analisar] arquivo vazio");
      return NextResponse.json(
        { error: "Arquivo vazio ou inválido." },
        { status: 400 }
      );
    }

    const sb = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await sb.auth.getUser();

    if (authError) {
      console.error("[api/catalogos/analisar] erro auth.getUser:", authError);
      return NextResponse.json(
        { error: "Não foi possível validar o usuário." },
        { status: 401 }
      );
    }

    if (!user) {
      console.error("[api/catalogos/analisar] usuário não autenticado");
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    console.log("[api/catalogos/analisar] user.id:", user.id);

    const ent = await getEntitlements(sb, user.id);

    console.log("[api/catalogos/analisar] plan:", ent.plan);
    console.log("[api/catalogos/analisar] isPlus:", ent.isPlus);

    if (!ent.isPlus) {
      console.error(
        "[api/catalogos/analisar] acesso negado. plano atual:",
        ent.plan
      );
      return NextResponse.json(
        { error: "Essa funcionalidade está disponível apenas no plano PLUS." },
        { status: 403 }
      );
    }

    console.log("[api/catalogos/analisar] iniciando analyzeCatalogBuffer...");
    const result = await analyzeCatalogBuffer(fileName, buffer);

    console.log("[api/catalogos/analisar] análise concluída");
    console.log(
      "[api/catalogos/analisar] parsedRows:",
      result.aiSummary?.parsedRows ?? 0
    );
    console.log("[api/catalogos/analisar] mode:", result.mode);

    const title = fileName.replace(/\.[^.]+$/, "");
    const isStructured =
      result.mode === "structured" &&
      Array.isArray(result.rows) &&
      result.rows.length > 0;

    console.log("[api/catalogos/analisar] salvando supplier_catalogs...");
    const { data: catalog, error: catalogError } = await sb
      .from("supplier_catalogs")
      .insert({
        user_id: user.id,
        title,
        file_name: fileName,
        source_type: "pdf",
        status: isStructured ? "analyzed" : "parsed",
        items_count: isStructured ? result.rows.length : 0,
      })
      .select("id")
      .single();

    if (catalogError || !catalog) {
      console.error(
        "[api/catalogos/analisar] erro ao salvar supplier_catalogs:",
        catalogError
      );
      return NextResponse.json(
        { error: "Falha ao salvar catálogo no histórico." },
        { status: 500 }
      );
    }

    console.log("[api/catalogos/analisar] catalog.id:", catalog.id);

    if (isStructured) {
      console.log("[api/catalogos/analisar] salvando supplier_catalog_items...");

      const itemPayload = result.rows.map((row) => ({
        catalog_id: catalog.id,
        user_id: user.id,
        raw_name: row.productName,
        normalized_name: row.productName,
        supplier_sku: row.sku,
        brand: row.brand,
        category: row.category,
        supplier_cost: row.supplierCost,
        min_qty: row.unitsPerBox,
        unit: row.unitsPerBox ? "caixa" : "un",
        notes: row.notes,
        raw_data: {
          model: row.model,
          unitPrice: row.unitPrice,
          boxPrice: row.boxPrice,
          unitsPerBox: row.unitsPerBox,
          specs: row.specs,
          mlPriceAvg: row.mlPriceAvg,
          mlPriceMin: row.mlPriceMin,
          mlPriceMax: row.mlPriceMax,
          estimatedMargin: row.estimatedMargin,
          estimatedProfit: row.estimatedProfit,
          demandScore: row.demandScore,
          competitionScore: row.competitionScore,
          opportunityScore: row.opportunityScore,
          riskLevel: row.riskLevel,
          worthBuying: row.worthBuying,
          aiSummary: row.aiSummary,
        },
      }));

      const { data: insertedItems, error: itemsError } = await sb
        .from("supplier_catalog_items")
        .insert(itemPayload)
        .select("id, raw_name, supplier_sku");

      if (itemsError) {
        console.error(
          "[api/catalogos/analisar] erro ao salvar supplier_catalog_items:",
          itemsError
        );

        await sb.from("catalog_runs").insert({
          catalog_id: catalog.id,
          user_id: user.id,
          step: "analyze",
          status: "error",
          logs: [
            {
              at: new Date().toISOString(),
              message: "Catálogo salvo, mas houve falha ao salvar os itens.",
              details: String(itemsError.message || "unknown_error"),
            },
          ],
        });

        return NextResponse.json(
          {
            ok: true,
            warning:
              "Catálogo salvo, mas houve falha ao salvar os itens analisados.",
            savedCatalogId: catalog.id,
            result,
          },
          { status: 200 }
        );
      }

      console.log(
        "[api/catalogos/analisar] total supplier_catalog_items salvos:",
        insertedItems?.length ?? 0
      );

      if (insertedItems?.length) {
        console.log(
          "[api/catalogos/analisar] salvando catalog_item_analysis..."
        );

        const analysisPayload = insertedItems.map((item, index) => {
          const row = result.rows[index];

          return {
            item_id: item.id,
            user_id: user.id,
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
              aiSummary: row.aiSummary,
              source: "catalog-analysis-v2",
              worthBuying: row.worthBuying,
              specs: row.specs,
              notes: row.notes,
              supplierSku: row.sku,
              model: row.model,
              brand: row.brand,
              category: row.category,
            },
            ai_summary: row.aiSummary,
          };
        });

        const { error: analysisError } = await sb
          .from("catalog_item_analysis")
          .insert(analysisPayload);

        if (analysisError) {
          console.error(
            "[api/catalogos/analisar] erro ao salvar catalog_item_analysis:",
            analysisError
          );

          await sb.from("catalog_runs").insert({
            catalog_id: catalog.id,
            user_id: user.id,
            step: "analyze",
            status: "error",
            logs: [
              {
                at: new Date().toISOString(),
                message:
                  "Catálogo e itens salvos, mas houve falha ao salvar a análise detalhada.",
                details: String(analysisError.message || "unknown_error"),
              },
            ],
          });

          return NextResponse.json(
            {
              ok: true,
              warning:
                "Catálogo e itens salvos, mas houve falha ao salvar a análise detalhada.",
              savedCatalogId: catalog.id,
              result,
            },
            { status: 200 }
          );
        }

        console.log(
          "[api/catalogos/analisar] catalog_item_analysis salvo com sucesso"
        );
      }
    } else {
      console.log(
        "[api/catalogos/analisar] catálogo em manual_review/parsed; itens não serão salvos"
      );
    }

    const { error: runError } = await sb.from("catalog_runs").insert({
      catalog_id: catalog.id,
      user_id: user.id,
      step: "analyze",
      status: "success",
      logs: [
        {
          at: new Date().toISOString(),
          message: isStructured
            ? `Análise concluída com ${result.rows.length} itens estruturados.`
            : "Análise concluída sem estrutura confiável. Catálogo mantido em revisão.",
          mode: result.mode,
          parsedRows: result.aiSummary?.parsedRows ?? 0,
        },
      ],
    });

    if (runError) {
      console.error(
        "[api/catalogos/analisar] erro ao salvar catalog_runs:",
        runError
      );
    }

    console.log("[api/catalogos/analisar] finalizado com sucesso");
    console.log("==================================================");

    return NextResponse.json({
      ok: true,
      savedCatalogId: catalog.id,
      result,
    });
  } catch (error) {
    console.error("[api/catalogos/analisar] erro fatal:", error);

    const message =
      error instanceof Error ? error.message : "Erro interno ao analisar catálogo.";

    if (message.includes("OPENAI_INSUFFICIENT_QUOTA")) {
      return NextResponse.json(
        {
          ok: false,
          code: "analysis_package_required",
          message:
            "Você atingiu o limite de análises disponível no seu pacote atual. Adquira um pacote adicional para continuar.",
        },
        { status: 402 }
      );
    }

    if (message.includes("Missing OPENAI_API_KEY")) {
      return NextResponse.json(
        {
          ok: false,
          message: "A análise está temporariamente indisponível no momento.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: "Erro interno ao analisar catálogo.",
      },
      { status: 500 }
    );
  }
}
