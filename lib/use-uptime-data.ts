"use client";

import { useQuery, UseQueryResult } from "@tanstack/react-query";

interface UptimeRecord {
  id: string;
  date: string;
  powerSupply: string;
  startTime: string;
  endTime: string | null;
  duration: number;
  utilization: number;
  testRun: boolean;
}

interface UptimeListResponse {
  success: boolean;
  uptimes: UptimeRecord[];
}

async function fetchUptimeData(
  startDate: string,
  endDate: string
): Promise<UptimeRecord[]> {
  const url = `/uptime/api/uptime/list?startDate=${startDate}&endDate=${endDate}`;

  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch uptime data");
  }

  const data: UptimeListResponse = await response.json();
  return data.uptimes || [];
}

export function useUptimeData(
  selectedMonth: number,
  selectedYear: number,
  refreshKey?: number
): UseQueryResult<UptimeRecord[], Error> {
  const startDate = new Date(selectedYear, selectedMonth, 1);
  const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

  return useQuery({
    queryKey: ["uptimes", selectedYear, selectedMonth, refreshKey],
    queryFn: () =>
      fetchUptimeData(startDate.toISOString(), endDate.toISOString()),
    staleTime: 0, // Always refetch to ensure fresh data
    gcTime: 60 * 1000, // Keep in cache for 1 minute for quick navigation
  });
}
