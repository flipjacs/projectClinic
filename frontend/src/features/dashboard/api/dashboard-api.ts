import { api } from "@/lib/api";
import type { DashboardResponse } from "../types/dashboard";

/**
 * Busca os dados do painel. Mantido isolado para ser fácil de ajustar caso o
 * endpoint mude de nome/forma no backend.
 */
export async function getDashboard(): Promise<DashboardResponse> {
  const { data } = await api.get<DashboardResponse>("/dashboard");
  return data;
}
