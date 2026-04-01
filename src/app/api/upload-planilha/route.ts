// src/app/api/upload-planilha/route.ts

import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { normalizarPlanilha } from "@/lib/normalizarPlanilha";
import { calcularDre } from "@/lib/dre/calcularDre";

import { createServerClient } from "@/integrations/supabase/server";
import { getEntitlements } from "@/integrations/supabase/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   Helpers
============================================================ */

function isEmptyRow(row: any[]) {
  return !row?.some((v) => String(v ?? "").trim() !== "");
}

function pickHeaderRowIndex(data: any[][]) {
  for (let i = 0; i < Math.min(data.length, 30); i++) {
    const row = data[i] || [];

    const nonEmpty = row.filter(
      (c) => String(c ?? "").trim() !== ""
    ).length;

    const nonEmptyStrings = row.filter((c) => {
      const s = String(c ?? "").trim();
      return s !== "" && isNaN(Number(s));
    }).length;

    if (nonEmpty >= 3 && nonEmptyStrings >= 2) {
      return i;
    }
  }

  return -1;
}

function makeUniqueHeaders(headers: any[]) {
  const used = new Map<string, number>();

  return headers.map((cell, index) => {
    const base =
      String(cell ?? "").trim() || `COL_${index + 1}`;

    const count = used.get(base) ?? 0;
    used.set(base, count + 1);

    return count === 0 ? base : `${base}_${count + 1}`;
  });
}

/* ============================================================
   POST
============================================================ */

export async function POST(request: Request) {
  try {
    /* ============================
       AUTH
    ============================ */

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401 }
      );
    }

    /* ============================
       ENTITLEMENTS (Trial / Pro)
    ============================ */

    const ent = await getEntitlements(supabase, user.id);

    if (!ent.canUseApp) {
      return NextResponse.json(
        { error: "trial_expired" },
        { status: 402 }
      );
    }

    // Limite FREE (server-side)
    if (!ent.isPro) {
      const { count, error: countErr } = await supabase
        .from("simulacoes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (countErr) {
        return NextResponse.json(
          { error: countErr.message },
          { status: 500 }
        );
      }

      if ((count ?? 0) >= ent.maxReports) {
        return NextResponse.json(
          { error: "limit_reached", max: ent.maxReports },
          { status: 403 }
        );
      }
    }

    /* ============================
       FILE
    ============================ */

    const formData = await request.formData();

    const file =
      (formData.get("file") as File | null) ||
      (formData.get("planilha") as File | null);

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não enviado" },
        { status: 400 }
      );
    }

    if (!file.size || file.size <= 0) {
      return NextResponse.json(
        { error: "Arquivo veio vazio (0 bytes)." },
        { status: 400 }
      );
    }

    const ext =
      (file.name.split(".").pop() || "").toLowerCase();

    if (ext !== "xlsx" && ext !== "csv") {
      return NextResponse.json(
        { error: "Formato inválido. Envie .xlsx ou .csv." },
        { status: 400 }
      );
    }

    console.log("[upload-planilha]", {
      user: user.id,
      fileName: file.name,
      type: file.type,
      size: file.size,
    });

    /* ============================
       READ FILE
    ============================ */

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let workbook: XLSX.WorkBook;

    if (ext === "csv" || file.type.includes("csv")) {
      const text = buffer.toString("utf8");
      workbook = XLSX.read(text, { type: "string" });
    } else {
      const u8 = new Uint8Array(arrayBuffer);
      workbook = XLSX.read(u8, {
        type: "array",
        WTF: false,
      });
    }

    const sheetName = workbook.SheetNames?.[0];

    if (!sheetName) {
      return NextResponse.json(
        { error: "Não foi possível ler a planilha." },
        { status: 400 }
      );
    }

    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      return NextResponse.json(
        { error: "Aba principal não encontrada." },
        { status: 400 }
      );
    }

    /* ============================
       HEADER DETECTION
    ============================ */

    const aoa = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    }) as any[][];

    const cleaned = aoa.filter((r) => !isEmptyRow(r));

    if (!cleaned.length) {
      return NextResponse.json(
        { error: "Planilha vazia." },
        { status: 400 }
      );
    }

    const headerIdx = pickHeaderRowIndex(cleaned);

    if (headerIdx === -1) {
      return NextResponse.json(
        { error: "Cabeçalho não identificado." },
        { status: 400 }
      );
    }

    const sheetHeaders = makeUniqueHeaders(
      cleaned[headerIdx]
    );

    const dataRows = cleaned.slice(headerIdx + 1);

    const rows = dataRows.map((row) => {
      const obj: Record<string, any> = {};
      sheetHeaders.forEach((h, i) => {
        obj[h] = row?.[i] ?? "";
      });
      return obj;
    });

    const rowsValidas = rows.filter((r) =>
      Object.values(r).some(
        (v) => String(v ?? "").trim() !== ""
      )
    );

    if (!rowsValidas.length) {
      return NextResponse.json(
        { error: "Sem linhas válidas após cabeçalho." },
        { status: 400 }
      );
    }

    /* ============================
       NORMALIZAÇÃO
    ============================ */

    const {
      linhas,
      camposDetectados,
      camposIgnorados,
      headers: headersNormalizados,
    } = normalizarPlanilha(rowsValidas);

    /* ============================
       AVISOS
    ============================ */

    const avisos: string[] = [];

    if (!camposDetectados?.receita)
      avisos.push("Receita não reconhecida.");

    if (!camposDetectados?.taxa)
      avisos.push("Taxas não reconhecidas.");

    if (!camposDetectados?.logistica)
      avisos.push("Logística não reconhecida.");

    if (!camposDetectados?.custo)
      avisos.push("Custo do produto não reconhecido.");

    /* ============================
       DRE
    ============================ */

    const dre = calcularDre(linhas);

    const nome = `Simulação - ${new Date().toLocaleString(
      "pt-BR"
    )}`;

    const payload = {
      nome,
      user_id: user.id,
      receita_total: dre.receitaTotal,
      custo_produtos: dre.custoProdutos,
      taxas: dre.taxas,
      logistica: dre.logistica,
      lucro: dre.lucro,
      margem: dre.margem,
      origem: "upload",
      arquivo_nome: file.name,
      dados: {
        linhas,
        meta: {
          avisos,
          camposDetectados,
          camposIgnorados,
          sheetHeaders,
          headersNormalizados,
          totalLinhasBrutas: aoa.length,
          totalLinhasSemVazias: cleaned.length,
          totalLinhasAposHeader: rows.length,
          totalLinhasValidas: rowsValidas.length,
          sheetName,
          ext,
          headerIdx,
        },
      },
    };

    /* ============================
       SAVE
    ============================ */

    const { data, error } = await supabase
      .from("simulacoes")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error("[upload-planilha] DB ERROR:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    /* ============================
       SUCCESS
    ============================ */

    return NextResponse.json({
      id: data.id,
      nome,
      arquivo_nome: file.name,
      dre,
      avisos,
      camposDetectados,
      camposIgnorados,
      sheetHeaders,
      headersNormalizados,
      totalLinhasBrutas: aoa.length,
      totalLinhasValidas: rowsValidas.length,
      headerIdx,
      sheetName,
      message: "Upload e DRE calculados com sucesso",
    });

  } catch (err: any) {
    console.error("[upload-planilha] ERROR:", err);

    return NextResponse.json(
      {
        error:
          err?.message ||
          "Erro desconhecido ao processar a planilha",
      },
      { status: 500 }
    );
  }
}




