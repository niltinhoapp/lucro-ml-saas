export async function parseCsvCatalog(buffer: Buffer) {
  const text = buffer.toString("utf-8");

  const rows = text
    .split("\n")
    .slice(1)
    .map((line) => {
      const cols = line.split(",");

      return {
        nome: cols[0],
        preco: Number(cols[1]),
      };
    });

  return {
    text,
    rows,
    hasUsableText: text.trim().length > 0,
  };
}