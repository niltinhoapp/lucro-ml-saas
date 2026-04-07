export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sha256Buffer } from "@/lib/catalog/hash";
import { createAdminClient } from "@/integrations/supabase/admin";
import { createServerClient } from "@/integrations/supabase/server";

async function assertCatalogQuota(userId: string) {
  const admin = createAdminClient();
  const monthLimit = Number(process.env.CATALOG_MONTHLY_LIMIT_PLUS || "20");

  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);

  const { count, error } = await admin
    .from("catalog_jobs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", start.toISOString());

  if (error) throw error;
  if ((count || 0) >= monthLimit) {
    throw new Error("Limite mensal de catálogos atingido para o plano atual.");
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
      return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
    }

    await assertCatalogQuota(user.id);

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Arquivo inválido." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ ok: false, error: "Envie apenas PDF." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileHash = sha256Buffer(buffer);

    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("catalog_jobs")
      .select("id,status")
      .eq("user_id", user.id)
      .eq("file_hash", fileHash)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        ok: true,
        reused: true,
        jobId: existing.id,
        status: existing.status,
      });
    }

    const bucket = process.env.CATALOG_BUCKET || "catalogs";
    const storagePath = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: inserted, error: insertError } = await admin
      .from("catalog_jobs")
      .insert({
        user_id: user.id,
        file_name: file.name,
        storage_path: storagePath,
        file_hash: fileHash,
        status: "queued",
        source: "ai",
      })
      .select("id,status,file_name,created_at")
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      ok: true,
      jobId: inserted.id,
      status: inserted.status,
      fileName: inserted.file_name,
      createdAt: inserted.created_at,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Falha ao enviar catálogo." },
      { status: 500 }
    );
  }
}





