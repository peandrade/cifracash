"use client";

import { useFetch, type UseFetchReturn } from "./use-fetch";
import type { CardsAnalyticsData } from "@/types/api-responses";

// Re-export types for backwards compatibility
export type {
  CardsAnalyticsData,
  CardSpendingByCategory,
  CardMonthlySpending,
  CardBreakdown,
  CardAlert,
  CardsSummary,
} from "@/types/api-responses";

interface UseCardsAnalyticsOptions {
  enabled?: boolean;
}

export function useCardsAnalytics(options: UseCardsAnalyticsOptions = {}): UseFetchReturn<CardsAnalyticsData> {
  const { enabled = true } = options;
  return useFetch<CardsAnalyticsData>("/api/cards/analytics", {
    errorMessage: "Erro ao buscar analytics de cartoes",
    immediate: enabled,
  });
}
