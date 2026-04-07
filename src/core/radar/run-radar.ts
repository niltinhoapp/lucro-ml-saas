import { fetchMl } from "./ml-client";
import { calculateScore } from "./scoring";
import { classifyItem } from "./strategy-engine";

export async function runRadar(query: string) {
  const items = await fetchMl(query);

  const enriched = items.map((item: any) => {
    const score = calculateScore(item);
    const strategy = classifyItem({ ...item, ...score });

    return {
      ...item,
      ...score,
      ...strategy,
    };
  });

  return enriched;
}
