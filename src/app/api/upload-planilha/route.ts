import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import { normalizarPlanilha } from "@/lib/normalizarPlanilha";
import { calcularDre } from "@/lib/dre/calcularDre";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

function isEmptyRow(r: any[]) {
  return !r?.some((v) => String(v ?? "").trim() !== "");
}

function pickHeaderRowIndex(data: any[][]) {
  for (let i = 0; i < Math.min(data.length, 30); i++) {
    const row = data[i] || [];
    const nonEmpty = row.filter((c) => String(c ?? "").trim() !== "").length;
    const nonEmptyStrings = row.filter((c) => {
      const s = String(c ?? "").trim();
      return s !== "" && isNaN(Number(s));
    }).length;

    if (nonEmpty >= 3 && nonEmptyStrings >= 2) return i;
  }
  return -1;
}

function makeUniqueHeaders(h: any[]) {
  const used = new Map<string, number>();
  return h.map((cell, idx) => {
    const base = String(cell ?? "").trim() || `COL_${idx + 1}`;
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  });
}

export async function POST(request: Request) {
  try {
    // ✅ ENV safe
    const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    const supabase = createClient(supabaseUrl, serviceKey);

    const formData = await request.formData();

    // ✅ aceita "file" ou "planilha" (pra não quebrar se variar no front)
    const file =
      (formData.get("file") as File | null) ||
      (formData.get("planilha") as File | null);

    if (!file) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    }

    console.log("[upload-planilha] nome:", file.name, "type:", file.type, "size:", file.size);

    if (!file.size || file.size <= 0) {
      return NextResponse.json({ error: "Arquivo veio vazio (0 bytes)." }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (ext !== "xlsx" && ext !== "csv") {
      return NextResponse.json(
        { error: "Formato inválido. Envie .xlsx ou .csv." },
        { status: 400 }
      );
    }

    // ✅ sempre trabalhar com Buffer (node) — evita corrupção do XLSX
    const arrayBuffer = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);

    let workbook: XLSX.WorkBook;

    if (ext === "csv" || file.type.includes("csv")) {
      // CSV: melhor ler como string (evita parser “achar zip”)
      const text = buf.toString("utf8");
      workbook = XLSX.read(text, { type: "string" });
    } else {
      // XLSX: ler como buffer (mais estável no node)
      const u8 = new Uint8Array(arrayBuffer);
workbook = XLSX.read(u8, { type: "array", WTF: false });
    }

    const sheetName = workbook.SheetNames?.[0];
    if (!sheetName) {
      return NextResponse.json(
        { error: "Não foi possível ler a planilha (sem abas/sem dados)." },
        { status: 400 }
      );
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      return NextResponse.json(
        { error: "Aba principal não encontrada no arquivo." },
        { status: 400 }
      );
    }

    // === AOA pra achar cabeçalho em qualquer linha ===
    const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
    const cleaned = aoa.filter((r) => !isEmptyRow(r));

    if (!cleaned.length) {
      return NextResponse.json(
        { error: "A planilha está vazia (sem linhas de dados)." },
        { status: 400 }
      );
    }

    const headerIdx = pickHeaderRowIndex(cleaned);
    if (headerIdx === -1) {
      return NextResponse.json(
        { error: "Não encontrei uma linha de cabeçalho válida nessa planilha." },
        { status: 400 }
      );
    }

    const sheetHeaders = makeUniqueHeaders(cleaned[headerIdx]);
    const dataRows = cleaned.slice(headerIdx + 1);

    const rows = dataRows.map((r) => {
      const obj: Record<string, any> = {};
      sheetHeaders.forEach((h, i) => (obj[h] = r?.[i] ?? ""));
      return obj;
    });

    const rowsValidas = rows.filter((r) =>
      Object.values(r ?? {}).some((v) => String(v ?? "").trim() !== "")
    );

    if (!rowsValidas.length) {
      return NextResponse.json(
        { error: "A planilha só contém linhas vazias após o cabeçalho." },
        { status: 400 }
      );
    }

    // ✅ Normalização
    const {
      linhas,
      camposDetectados,
      camposIgnorados,
      headers: headersNormalizados,
    } = normalizarPlanilha(rowsValidas);

    // ✅ Avisos
    const avisos: string[] = [];
    if (!camposDetectados?.receita)
      avisos.push("Receita não foi reconhecida. Verifique coluna de valor recebido/receita.");
    if (!camposDetectados?.taxa)
      avisos.push("Taxas não foram reconhecidas. O DRE pode ficar otimista.");
    if (!camposDetectados?.logistica)
      avisos.push("Logística/frete não foi reconhecida. O DRE pode ficar otimista.");
    if (!camposDetectados?.custo)
      avisos.push("Custo do produto (CMV) não foi encontrado. Lucro pode ficar superestimado.");

    const dre = calcularDre(linhas);
    const nome = `Simulação - ${new Date().toLocaleString("pt-BR")}`;

    const payload = {
      nome,
      user_id: null,
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
          arquivo_nome: file.name,
          ext,
          headerIdx,
        },
      },
    };

    const { data, error } = await supabase
      .from("simulacoes")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error("[upload-planilha] supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      nome,
      arquivo_nome: file.name,
      dre,
      message: "Upload e DRE calculados com sucesso",
      avisos,
      camposDetectados,
      camposIgnorados,
      sheetHeaders,
      headersNormalizados,
      totalLinhasBrutas: aoa.length,
      totalLinhasValidas: rowsValidas.length,
      headerIdx,
      sheetName,
    });
  } catch (err: any) {
    console.error("[upload-planilha] ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Erro desconhecido ao processar a planilha" },
      { status: 500 }
    );
  }
}