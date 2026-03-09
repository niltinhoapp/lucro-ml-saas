import { NextResponse } from "next/server";
import { createMarketAnalysis, getTrendItems } from "@/lib/market/mock";
import { generateKitIdeas } from "@/lib/market/advanced";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const produto = String(body?.produto ?? "mini projetor portátil");
  const analysis = createMarketAnalysis(produto);
  const related = getTrendItems().filter((item) => item.category === analysis.category).slice(0, 3);
  const kits = generateKitIdeas(produto, analysis.category, analysis.avgPrice).kits.slice(0, 2);

  return NextResponse.json({
    analysis,
    related,
    kits,
    nextActions: [
      "Entrar com anúncio principal + variação de kit campeão.",
      "Trabalhar faixa de preço próxima ao sugerido para acelerar conversão sem esmagar margem.",
      "Usar oferta com diferenciação visual e benefícios claros no título.",
    ],
  });
}
