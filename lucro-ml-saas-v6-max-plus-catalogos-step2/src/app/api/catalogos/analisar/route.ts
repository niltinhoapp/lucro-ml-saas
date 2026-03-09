import { NextResponse } from "next/server";
import { analyzeCatalogBuffer } from "@/lib/catalog/analyze";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

function safeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Erro inesperado ao analisar catálogo.";
}

export async function POST(req: Request) {
  console.log("==================================================");
  console.log("[api/catalogos/analisar] POST iniciado");

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    console.log("[api/catalogos/analisar] file recebido?", !!file);

    if (!file || !(file instanceof File)) {
      console.error("[api/catalogos/analisar] arquivo ausente ou inválido");
      return NextResponse.json(
        { error: "Arquivo não enviado corretamente." },
        { status: 400 }
      );
    }

    const fileName = file.name || "catalogo";
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

    const sb = await supabaseServer();

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

    const { data: profile, error: profileError } = await sb
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error(
        "[api/catalogos/analisar] erro ao buscar profile:",
        profileError
      );
      return NextResponse.json(
        { error: "Não foi possível validar o plano do usuário." },
        { status: 500 }
      );
    }

    console.log("[api/catalogos/analisar] plan:", profile?.plan);

    if (profile?.plan !== "plus") {
      console.error(
        "[api/catalogos/analisar] acesso negado. plano atual:",
        profile?.plan
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
      result.summary?.parsedRows ?? 0
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
        supplier_cost: row.supplierCost,
        raw_data: {
          avgMlPrice: row.avgMlPrice,
          estimatedMargin: row.estimatedMargin,
          demandScore: row.demandScore,
          competitionScore: row.competitionScore,
          opportunityScore: row.opportunityScore,
          riskLevel: row.riskLevel,
          aiSummary: row.aiSummary,
        },
      }));

      const { data: insertedItems, error: itemsError } = await sb
        .from("supplier_catalog_items")
        .insert(itemPayload)
        .select("id, raw_name");

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
            ml_price_avg: row.avgMlPrice,
            ml_price_min: row.avgMlPrice * 0.9,
            ml_price_max: row.avgMlPrice * 1.1,
            estimated_fees: row.avgMlPrice * 0.16,
            estimated_shipping: row.avgMlPrice < 79 ? 12 : 18,
            estimated_margin: row.estimatedMargin,
            estimated_profit:
              row.avgMlPrice -
              row.supplierCost -
              row.avgMlPrice * 0.16 -
              (row.avgMlPrice < 79 ? 12 : 18),
            demand_score: row.demandScore,
            competition_score: row.competitionScore,
            opportunity_score: row.opportunityScore,
            risk_level:
              row.riskLevel === "baixo"
                ? "low"
                : row.riskLevel === "alto"
                ? "high"
                : "medium",
            analysis: {
              aiSummary: row.aiSummary,
              source: "catalog-analysis-v2",
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
          parsedRows: result.summary?.parsedRows ?? 0,
          extractionQuality: result.summary?.extractionQuality ?? "baixa",
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
    console.log("==================================================");

    return NextResponse.json(
      { error: safeErrorMessage(error) },
      { status: 500 }
    );
  }
}