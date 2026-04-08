export async function fetchMl(query: string) {
  const q = String(query ?? "").trim();

  if (!q) return [];

  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=20`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Mercado Livre ${res.status}`);
  }

  const json = await res.json();

  return Array.isArray(json?.results) ? json.results : [];
}