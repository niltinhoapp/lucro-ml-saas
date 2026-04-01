import type { Strategy } from "@/types/strategy";

export function getUnreadStrategies(strategies: Strategy[]) {
  return strategies.filter((item) => !item.isRead);
}

export function getStrategyOfWeek(strategies: Strategy[]) {
  return strategies.find((item) => !item.isRead) ?? strategies[0] ?? null;
}
