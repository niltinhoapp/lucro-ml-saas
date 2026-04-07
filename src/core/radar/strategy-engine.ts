export function classifyItem(item: any) {
  if (item.score > 50) return { status: "oportunidade" };
  if (item.score > 30) return { status: "revisar" };
  return { status: "evitar" };
}
