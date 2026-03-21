import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type AiPdfProduct = {
  title: string;
  estimatedCost: number | null;
  possibleSku: string | null;
  categoryHint: string | null;
  opportunityLevel: "baixa" | "media" | "alta";
  notes: string[];
};

type PdfAiResponse = {
  ok: boolean;
  source: "pdf_catalog_ai";
  fileName: string;
  itemsFound: number;
  summary: string;
  recommendedProducts: AiPdfProduct[];
};

function extractJsonBlock(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("A IA não retornou JSON válido.");
  }

  return text.slice(start, end + 1);
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error: "OPENAI_API_KEY não configurada no .env.local.",
        },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Envie um PDF no campo 'file'.",
        },
        { status: 400 }
      );
    }

    const fileName = file.name || "catalogo.pdf";

    if (!fileName.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        {
          ok: false,
          error: "O arquivo enviado precisa ser PDF.",
        },
        { status: 400 }
      );
    }

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
                "Você é um analista de catálogos para revenda no Mercado Livre. " +
                "Leia o PDF enviado e extraia produtos de forma objetiva. " +
                "Retorne SOMENTE JSON válido, sem markdown, sem explicação extra.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                'Analise este PDF e devolva JSON no formato: ' +
                '{"summary":"...",' +
                '"recommendedProducts":[{"title":"...",' +
                '"estimatedCost":0,' +
                '"possibleSku":"...",' +
                '"categoryHint":"...",' +
                '"opportunityLevel":"alta|media|baixa",' +
                '"notes":["..."]}]}' +
                " " +
                "Regras: " +
                "1) identifique os produtos mais claros do catálogo; " +
                "2) estimatedCost deve ser número quando houver preço/custo explícito, senão null; " +
                "3) possibleSku pode ser null; " +
                "4) categoryHint pode ser null; " +
                "5) opportunityLevel deve refletir potencial inicial de revenda; " +
                "6) notes deve trazer motivos curtos; " +
                "7) priorize produtos concretos, não texto institucional.",
            },
            {
              type: "input_file",
              file_id: uploaded.id,
            },
          ],
        },
      ],
    });

    const rawText =
      response.output_text ||
      "";

    const parsed = JSON.parse(extractJsonBlock(rawText)) as {
      summary?: string;
      recommendedProducts?: AiPdfProduct[];
    };

    const recommendedProducts = Array.isArray(parsed.recommendedProducts)
      ? parsed.recommendedProducts
      : [];

    const payload: PdfAiResponse = {
      ok: true,
      source: "pdf_catalog_ai",
      fileName,
      itemsFound: recommendedProducts.length,
      summary: parsed.summary?.trim() || "Análise concluída.",
      recommendedProducts,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro inesperado ao analisar PDF.";

    return NextResponse.json(
      {
        ok: false,
        error: "Falha ao processar o PDF com IA.",
        details: message,
      },
      { status: 500 }
    );
  }
}