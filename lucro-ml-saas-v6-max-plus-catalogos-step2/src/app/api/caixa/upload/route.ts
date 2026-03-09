import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

function isEmptyRow(r: any[]) {
  return !r?.some((v) => String(v ?? "").trim() !== "");
}

function headerIndex(rows: any[][]) {
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const row = rows[i] || [];
    const filled = row.filter((c) => String(c ?? "").trim() !== "").length;
    const filledText = row.filter((c) => {
      const s = String(c ?? "").trim();
      return s !== "" && isNaN(Number(s));
    }).length;

    if (filled >= 2 && filledText >= 1) return i;
  }
  return -1;
}

function uniqueHeaders(h: any[]) {
  const used = new Map<string, number>();
  return h.map((cell, idx) => {
    const base = String(cell ?? "").trim() || `COL_${idx + 1}`;
    const n = used.get(base) ?? 0;
    used.set(base, n + 1);
    return n === 0 ? base : `${base}_${n + 1}`;
  });
}

export async function POST(request: Request) {
  try {
    const supabase = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

    const form = await request.formData();
    const file =
      (form.get("file") as File | null) ||
      (form.get("planilha") as File | null) ||
      (form.get("arquivo") as File | null);

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não enviado. Use FormData com a chave 'file'." },
        { status: 400 }
      );
    }

    console.log("[caixa/upload] file:", file.name, file.type, file.size);

    if (!file.size) {
      return NextResponse.json({ error: "Arquivo veio vazio (0 bytes)." }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (ext !== "csv" && ext !== "xlsx") {
      return NextResponse.json({ error: "Formato inválido. Envie .csv ou .xlsx." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);

    let wb: XLSX.WorkBook;
    if (ext === "csv" || file.type.includes("csv")) {
      wb = XLSX.read(buf.toString("utf8"), { type: "string" });
    } else {
      wb = XLSX.read(new Uint8Array(arrayBuffer), { type: "array", WTF: false });
    }

    const sheetName = wb.SheetNames?.[0];
    if (!sheetName) {
      return NextResponse.json({ error: "Sem abas na planilha." }, { status: 400 });
    }

    const sheet = wb.Sheets[sheetName];
    if (!sheet) {
      return NextResponse.json({ error: "Aba principal não encontrada." }, { status: 400 });
    }

    const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
    const cleaned = aoa.filter((r) => !isEmptyRow(r));

    if (!cleaned.length) {
      return NextResponse.json({ error: "Planilha vazia." }, { status: 400 });
    }

    const hIdx = headerIndex(cleaned);
    if (hIdx === -1) {
      return NextResponse.json({ error: "Cabeçalho não encontrado." }, { status: 400 });
    }

    const headers = uniqueHeaders(cleaned[hIdx]);
    const dataRows = cleaned.slice(hIdx + 1);

    const linhas = dataRows
      .map((r) => {
        const obj: Record<string, any> = {};
        headers.forEach((h, i) => (obj[h] = r?.[i] ?? ""));
        return obj;
      })
      .filter((r) => Object.values(r).some((v) => String(v ?? "").trim() !== ""));

    if (!linhas.length) {
      return NextResponse.json({ error: "Sem linhas após o cabeçalho." }, { status: 400 });
    }

    const payload = {
      nome: `Fluxo de Caixa - ${new Date().toLocaleString("pt-BR")}`,
      user_id: null,
      origem: "upload",
      arquivo_nome: file.name,
      dados: {
        linhas,
        meta: {
          sheetName,
          ext,
          headerIdx: hIdx,
          sheetHeaders: headers,
          totalLinhasBrutas: aoa.length,
          totalLinhasValidas: linhas.length,
        },
      },
    };

    // ✅ ajuste o nome da tabela se necessário
    const { data, error } = await supabase
      .from("caixa_uploads")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error("[caixa/upload] supabase:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (e: any) {
    console.error("[caixa/upload] ERROR:", e);
    return NextResponse.json({ error: e?.message || "Erro no caixa/upload" }, { status: 500 });
  }
}