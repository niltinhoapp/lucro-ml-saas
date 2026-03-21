import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { enrichProductsWithMlData, type PdfProduct } from "@/lib/radar/enrich-with-ml";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function extractJsonBlock(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("A IA não retornou JSON válido.");
  }
  return text.slice(start, end + 1);
}

async function readCatalogWithAi(file: File): Promise<{
  summary: string;
  products: PdfProduct[];
  readingQuality: "baixa" | "media" | "alta";
}> {
  const uploaded = await client.files.create({
    file,
    purpose: "user_data",
  });

  const response = await client.responses.create({
    model: "gpt-5.4",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "Você é um analista de catálogos para revenda. Leia o arquivo e extraia produtos. " +
              "Se o PDF parecer imagem ou catálogo escaneado, faça leitura visual do conteúdo. " +
              "Retorne somente JSON válido.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              'Retorne JSON no formato: ' +
              '{"summary":"...",' +
              '"readingQuality":"baixa|media|alta",' +
              '"products":[{"title":"...",' +
              '"estimatedCost":0,' +
              '"possibleSku":"...",' +
              '"categoryHint":"...",' +
              '"opportunityLevel":"alta|media|baixa",' +
              '"notes":["..."]}]}' +
              " Priorize produtos reais e ignore texto institucional.",
          },
          {
            type: "input_file",
            file_id: uploaded.id,
          },
        ],
      },
    ],
  });

  const raw = response.output_text || "";
  const parsed = JSON.parse(extractJsonBlock(raw)) as {
    summary?: string;
    readingQuality?: "baixa" | "media" | "alta";
    products?: PdfProduct[];
  };

  return {
    summary: parsed.summary?.trim() || "Análise concluída.",
    products: Array.isArray(parsed.products) ? parsed.products : [],
    readingQuality: parsed.readingQuality || "baixa",
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Envie um PDF no campo file." },
        { status: 400 }
      );
    }

    const aiRead = await readCatalogWithAi(file);
    const enriched = await enrichProductsWithMlData(aiRead.products);

    return NextResponse.json({
      ok: true,
      source: "pdf_catalog_ai_ml",
      fileName: file.name,
      readingQuality: aiRead.readingQuality,
      summary: aiRead.summary,
      itemsFound: aiRead.products.length,
      products: enriched,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro inesperado.";
    return NextResponse.json(
      {
        ok: false,
        error: "Falha ao analisar PDF e integrar com ML.",
        details: message,
      },
      { status: 500 }
    );
  }
}