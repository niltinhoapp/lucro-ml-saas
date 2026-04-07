export async function fetchMl(query: string) {
  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Erro ao buscar no Mercado Livre");
  }

  const json = await res.json();

  return json.results || [];
}