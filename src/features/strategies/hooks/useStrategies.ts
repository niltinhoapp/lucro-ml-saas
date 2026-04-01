"use client";

import useSWR from "swr";
import type { StrategiesResponse } from "@/features/strategies/types";

const fetcher = async (url: string): Promise<StrategiesResponse> => {
  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Falha ao carregar estratégias.");
  }

  return response.json();
};

export function useStrategies() {
  return useSWR<StrategiesResponse>("/api/strategies", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
}

