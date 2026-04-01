export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sha256Buffer } from "@/lib/catalog/hash";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/supabase/server";

async function assertCatalogQuota(userId: string) {
  const admin = createAdminClient();
  const monthLimit = Number(process.env.CATALOG_MONTHLY_LIMIT_PLUS || "20");

  const { data: counter, error } = await admin
    .from("usage_counters")
    .select("catalogs_used")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao consultar limite de uso: ${error.message}`);
  }

  const used = counter?.catalogs_used ?? 0;

  if (used >= monthLimit) {
    throw new Error("Limite mensal de catálogos atingido para o plano atual.");
  }
}

async function incrementCatalogUsage(userId: string) {
  const admin = createAdminClient();

  const { data: current, error: selectError } = await admin
    .from("usage_counters")
    .select("user_id, catalogs_used, reports_used, ai_used, catalog_items_analyzed")
    .eq("user_id", userId)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Falha ao consultar usage_counters: ${selectError.message}`);
  }

  if (!current) {
    const { error: insertError } = await admin.from("usage_counters").insert({
      user_id: userId,
      catalogs_used: 1,
      catalog_items_analyzed: 0,
      ai_used: 0,
      reports_used: 0,
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      throw new Error(`Falha ao criar usage_counters: ${insertError.message}`);
    }

    return;
  }

  const { error: updateError } = await admin
    .from("usage_counters")
    .update({
      catalogs_used: (current.catalogs_used ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(`Falha ao atualizar usage_counters: ${updateError.message}`);
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "Não autenticado." },
        { status: 401 }
      );
    }

    await assertCatalogQuota(user.id);

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Arquivo inválido." },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { ok: false, error: "Envie apenas PDF." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileHash = sha256Buffer(buffer);

    const admin = createAdminClient();

    const { data: existing, error: existingError } = await admin
      .from("supplier_catalogs")
      .select("id, status, title")
      .eq("user_id", user.id)
      .eq("file_hash", fileHash)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Falha ao verificar catálogo existente: ${existingError.message}`);
    }

    if (existing) {
      return NextResponse.json({
        ok: true,
        reused: true,
        catalogId: existing.id,
        status: existing.status,
        title: existing.title,
      });
    }

    const bucket = process.env.CATALOG_BUCKET || "catalogs";
    const safeFileName = file.name.replace(/\s+/g, "-");
    const storagePath = `${user.id}/${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Falha no upload para o storage: ${uploadError.message}`);
    }

    const title = file.name.replace(/\.pdf$/i, "");

    const { data: inserted, error: insertError } = await admin
      .from("supplier_catalogs")
      .insert({
        user_id: user.id,
        title,
        file_name: file.name,
        file_path: storagePath,
        file_hash: fileHash,
        source_type: "pdf",
        status: "uploaded",
      })
      .select("id, status, title, created_at")
      .single();

    if (insertError || !inserted) {
      throw new Error(
        `Falha ao criar supplier_catalogs: ${insertError?.message || "registro não criado"}`
      );
    }

    const { error: runError } = await admin.from("catalog_runs").insert({
      catalog_id: inserted.id,
      user_id: user.id,
      step: "upload",
      status: "success",
      logs: [{ at: new Date().toISOString(), message: "Upload concluído." }],
    });

    if (runError) {
      throw new Error(`Falha ao registrar catalog_runs: ${runError.message}`);
    }

    await incrementCatalogUsage(user.id);

    return NextResponse.json({
      ok: true,
      catalogId: inserted.id,
      status: inserted.status,
      title: inserted.title,
      createdAt: inserted.created_at,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Falha ao enviar catálogo." },
      { status: 500 }
    );
  }
}