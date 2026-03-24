export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sha256Buffer } from "@/lib/catalog/hash";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/supabase/server";

// ================= HELPERS =================

function getFileType(fileName: string): "pdf" | "csv" | "xml" | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".xml")) return "xml";
  return null;
}

function getContentType(type: string) {
  if (type === "pdf") return "application/pdf";
  if (type === "csv") return "text/csv";
  if (type === "xml") return "application/xml";
  return "application/octet-stream";
}

// ================= QUOTA =================

async function assertCatalogQuota(userId: string) {
  const admin = createAdminClient();
  const monthLimit = Number(process.env.CATALOG_MONTHLY_LIMIT_PLUS || "20");

  const { data: counter } = await admin
    .from("usage_counters")
    .select("catalogs_used")
    .eq("user_id", userId)
    .maybeSingle();

  const used = counter?.catalogs_used ?? 0;

  if (used >= monthLimit) {
    throw new Error("Limite mensal de catálogos atingido.");
  }
}

async function incrementCatalogUsage(userId: string) {
  const admin = createAdminClient();

  const { data: current } = await admin
    .from("usage_counters")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!current) {
    await admin.from("usage_counters").insert({
      user_id: userId,
      catalogs_used: 1,
      updated_at: new Date().toISOString(),
    });
    return;
  }

  await admin
    .from("usage_counters")
    .update({
      catalogs_used: (current.catalogs_used ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

// ================= ROUTE =================

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
    }

    await assertCatalogQuota(user.id);

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Arquivo inválido." }, { status: 400 });
    }

    const fileType = getFileType(file.name);

    if (!fileType) {
      return NextResponse.json(
        { ok: false, error: "Envie PDF, CSV ou XML." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileHash = sha256Buffer(buffer);

    const admin = createAdminClient();

    // ===== CACHE (evita reprocessar) =====
    const { data: existing } = await admin
      .from("supplier_catalogs")
      .select("id, status, title")
      .eq("user_id", user.id)
      .eq("file_hash", fileHash)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        ok: true,
        reused: true,
        catalogId: existing.id,
        status: existing.status,
        title: existing.title,
      });
    }

    // ===== STORAGE =====
    const bucket = process.env.CATALOG_BUCKET || "catalogs";
    const safeFileName = file.name.replace(/\s+/g, "-");
    const storagePath = `${user.id}/${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: getContentType(fileType),
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const title = file.name.replace(/\.(pdf|csv|xml)$/i, "");

    // ===== DB =====
    const { data: inserted } = await admin
      .from("supplier_catalogs")
      .insert({
        user_id: user.id,
        title,
        file_name: file.name,
        file_path: storagePath,
        file_hash: fileHash,
        source_type: fileType,
        status: "uploaded",
      })
      .select("*")
      .single();

    await admin.from("catalog_runs").insert({
      catalog_id: inserted.id,
      user_id: user.id,
      step: "upload",
      status: "success",
      logs: [{ at: new Date().toISOString(), message: "Upload concluído." }],
    });

    await incrementCatalogUsage(user.id);

    return NextResponse.json({
      ok: true,
      catalogId: inserted.id,
      status: inserted.status,
      title: inserted.title,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Erro no upload." },
      { status: 500 }
    );
  }
}