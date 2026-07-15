import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { ROLES } from "@/types/roles";
import {
  getAppointmentsReport,
  getDashboard,
  getFinanceReport,
  getInventoryReport,
  getPatientsReport,
} from "../api/reports-api";
import type { ResolvedRange } from "../utils/period";

export const reportKeys = {
  all: ["reports"] as const,
  dashboard: ["reports", "dashboard"] as const,
  patients: (range: ResolvedRange) => ["reports", "patients", range] as const,
  appointments: (range: ResolvedRange, dentistId?: number) =>
    ["reports", "appointments", range, dentistId ?? null] as const,
  finance: (range: ResolvedRange) => ["reports", "finance", range] as const,
  inventory: (range: ResolvedRange) => ["reports", "inventory", range] as const,
};

const STALE = 60_000;

/**
 * Permissões de relatórios espelhando o RBAC do backend (autoridade real).
 * Financeiro: ADMIN/DENTIST. Pacientes: ADMIN. Consultas e Estoque: todo staff.
 */
export function useReportsPermissions() {
  const { user } = useAuth();
  const role = user?.role;
  return {
    canFinance: role === ROLES.ADMIN || role === ROLES.DENTIST,
    canPatients: role === ROLES.ADMIN,
    canAppointments: Boolean(role),
    canInventory: Boolean(role),
  };
}

export function useDashboard() {
  return useQuery({
    queryKey: reportKeys.dashboard,
    queryFn: getDashboard,
    staleTime: STALE,
  });
}

export function usePatientsReport(range: ResolvedRange, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: reportKeys.patients(range),
    queryFn: () => getPatientsReport(range),
    enabled: options?.enabled ?? true,
    staleTime: STALE,
    placeholderData: keepPreviousData,
  });
}

export function useAppointmentsReport(
  range: ResolvedRange,
  dentistId?: number,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: reportKeys.appointments(range, dentistId),
    queryFn: () => getAppointmentsReport(range, dentistId),
    enabled: options?.enabled ?? true,
    staleTime: STALE,
    placeholderData: keepPreviousData,
  });
}

export function useFinanceReport(range: ResolvedRange, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: reportKeys.finance(range),
    queryFn: () => getFinanceReport(range),
    enabled: options?.enabled ?? true,
    staleTime: STALE,
    placeholderData: keepPreviousData,
  });
}

export function useInventoryReport(range: ResolvedRange, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: reportKeys.inventory(range),
    queryFn: () => getInventoryReport(range),
    enabled: options?.enabled ?? true,
    staleTime: STALE,
    placeholderData: keepPreviousData,
  });
}
