import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createServerClient } from "@/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ParsedLancamento = {
  release_date: string;
  transaction_type: string | null;
  description: string | null;
  amount: number;
  balance: number;
  direction: "in" | "out";
  categoria: string;
};

function isEmptyRow(row: unknown[]) {
  return !row?.some((value) => String(value ?? "").trim() !== "");
}

function headerIndex(rows: unknown[][]) {
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const row = rows[i] || [];
    const filled = row.filter((cell) => String(cell ?? "").trim() !== "").length;
    const filledText = row.filter((cell) => {
      const value = String(cell ?? "").trim();
      return value !== "" && Number.isNaN(Number(value));
    }).length;

    if (filled >= 2 && filledText >= 1) return i;
  }

  return -1;
}

function uniqueHeaders(headers: unknown[]) {
  const used = new Map<string, number>();

  return headers.map((cell, index) => {
    const base = String(cell ?? "").trim() || `COL_${index + 1}`;
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  });
}

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cleanText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function parseExcelDate(value: number) {
  const utcDays = Math.floor(value - 25569);
  const utcValue = utcDays * 86400;
  const dateInfo = new Date(utcValue * 1000);
  if (Number.isNaN(dateInfo.getTime())) return null;
  return dateInfo.toISOString().slice(0, 10);
}

function parseDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number" && Number.isFinite(value) && value > 20000) {
    return parseExcelDate(value);
  }

  const text = String(value ?? "").trim();
  if (!text) return null;

  const br = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (br) {
    const [, d, m, y] = br;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function parseMoney(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const text = String(value ?? "").trim();
  if (!text) return 0;

  const normalized = text
    .replace(/R\$/gi, "")
    .replace(/\s+/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.-]/g, "");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function findValue(row: Record<string, unknown>, matches: string[]) {
  for (const [key, value] of Object.entries(row)) {
    const normalized = normalizeHeader(key);
    if (matches.some((match) => normalized.includes(match))) {
      return value;
    }
  }
  return null;
}

function inferLancamento(row: Record<string, unknown>, index: number): ParsedLancamento {
  const dateValue = findValue(row, ["data", "date", "release date"]);
  const typeValue = findValue(row, ["tipo", "transaction type", "transacao", "movimento"]);
  const descValue = findValue(row, ["descricao", "description", "detalhe", "historico"]);
  const amountValue = findValue(row, ["valor", "amount", "liquido", "net", "entrada", "saida"]);
  const balanceValue = findValue(row, ["saldo", "balance"]);
  const categoryValue = findValue(row, ["categoria", "category"]);
  const directionValue = findValue(row, ["direction", "direcao"]);

  const amount = parseMoney(amountValue);
  const parsedDate = parseDate(dateValue) ?? new Date().toISOString().slice(0, 10);
  const description = cleanText(descValue) ?? JSON.stringify(row);
  const transactionType = cleanText(typeValue) ?? `Linha ${index + 1}`;
  const categoria = cleanText(categoryValue) ?? "Importado";

  let direction: "in" | "out" = amount >= 0 ? "in" : "out";
  const directionText = String(directionValue ?? "").toLowerCase();
  if (directionText.includes("out") || directionText.includes("saida")) direction = "out";
  if (directionText.includes("in") || directionText.includes("entrada")) direction = "in";

  return {
    release_date: parsedDate,
    transaction_type: transactionType,
    description,
    amount,
    balance: parseMoney(balanceValue),
    direction,
    categoria,
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: authError?.message || "Usuário não autenticado." },
        { status: 401 }
      );
    }

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

    if (!file.size) {
      return NextResponse.json({ error: "Arquivo veio vazio (0 bytes)." }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (ext !== "csv" && ext !== "xlsx") {
      return NextResponse.json(
        { error: "Formato inválido. Envie .csv ou .xlsx." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook =
      ext === "csv" || file.type.includes("csv")
        ? XLSX.read(buffer.toString("utf8"), { type: "string" })
        : XLSX.read(new Uint8Array(arrayBuffer), { type: "array", WTF: false });

    const sheetName = workbook.SheetNames?.[0];
    if (!sheetName) {
      return NextResponse.json({ error: "Sem abas na planilha." }, { status: 400 });
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      return NextResponse.json({ error: "Aba principal não encontrada." }, { status: 400 });
    }

    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
    const cleanedRows = rawRows.filter((row) => !isEmptyRow(row));

    if (!cleanedRows.length) {
      return NextResponse.json({ error: "Planilha vazia." }, { status: 400 });
    }

    const hIdx = headerIndex(cleanedRows);
    if (hIdx === -1) {
      return NextResponse.json({ error: "Cabeçalho não encontrado." }, { status: 400 });
    }

    const headers = uniqueHeaders(cleanedRows[hIdx]);
    const dataRows = cleanedRows.slice(hIdx + 1);

    const normalizedRows = dataRows
      .map((row) => {
        const obj: Record<string, unknown> = {};
        headers.forEach((header, index) => {
          obj[header] = row?.[index] ?? "";
        });
        return obj;
      })
      .filter((row) => Object.values(row).some((value) => String(value ?? "").trim() !== ""));

    if (!normalizedRows.length) {
      return NextResponse.json({ error: "Sem linhas após o cabeçalho." }, { status: 400 });
    }

    const nome = `Fluxo de Caixa - ${new Date().toLocaleString("pt-BR")}`;

    const { data: relatorio, error: relatorioError } = await supabase
      .from("caixa_relatorios")
      .insert({
        nome,
        arquivo_nome: file.name,
        user_id: user.id,
      })
      .select("id, nome, arquivo_nome")
      .single();

    if (relatorioError || !relatorio) {
      return NextResponse.json(
        { error: relatorioError?.message || "Erro ao criar relatório." },
        { status: 500 }
      );
    }

    const lancamentos = normalizedRows.map((row, index) => ({
      relatorio_id: relatorio.id,
      user_id: user.id,
      ...inferLancamento(row, index),
    }));

    const { error: lancamentosError } = await supabase
      .from("caixa_lancamentos")
      .insert(lancamentos);

    if (lancamentosError) {
      await supabase.from("caixa_relatorios").delete().eq("id", relatorio.id).eq("user_id", user.id);
      return NextResponse.json(
        { error: lancamentosError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: relatorio.id,
      nome: relatorio.nome,
      arquivo_nome: relatorio.arquivo_nome,
      total_lancamentos: lancamentos.length,
      message: "Upload concluído. Abrindo o relatório…",
    });
  } catch (error) {
    console.error("[api/caixa/upload] ERROR:", error);
    const message = error instanceof Error ? error.message : "Erro no caixa/upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
