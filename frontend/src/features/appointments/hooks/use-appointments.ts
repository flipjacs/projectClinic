import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { ROLES } from "@/types/roles";
import {
  cancelAppointment,
  changeAppointmentStatus,
  createAppointment,
  getAppointment,
  listAppointments,
  listDentists,
  listTodayAppointments,
  rescheduleAppointment,
  type ListAppointmentsParams,
  type TodayParams,
} from "../api/appointments-api";
import type {
  Appointment,
  AppointmentCreateInput,
  AppointmentRescheduleInput,
  AppointmentStatus,
  Dentist,
} from "../types/appointment";

export const appointmentKeys = {
  all: ["appointments"] as const,
  list: (params: ListAppointmentsParams) => ["appointments", "list", params] as const,
  today: (params: TodayParams) => ["appointments", "today", params] as const,
  detail: (id: number) => ["appointments", "detail", id] as const,
  dentists: ["appointments", "dentists"] as const,
};

export function useAppointments(params: ListAppointmentsParams) {
  return useQuery({
    queryKey: appointmentKeys.list(params),
    queryFn: () => listAppointments(params),
    placeholderData: keepPreviousData,
  });
}

export function useTodayAppointments(params: TodayParams = {}) {
  return useQuery({
    queryKey: appointmentKeys.today(params),
    queryFn: () => listTodayAppointments(params),
  });
}

export function useAppointment(id: number) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: () => getAppointment(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

function dedupeDentists(items: Appointment[]): Dentist[] {
  const map = new Map<number, Dentist>();
  for (const a of items) {
    if (!map.has(a.dentist.id)) map.set(a.dentist.id, { id: a.dentist.id, name: a.dentist.name });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

/**
 * Opções de profissionais para os seletores. ADMIN usa GET /users (fonte
 * completa). Demais perfis não têm endpoint de dentistas, então derivamos a
 * lista das consultas já existentes (somente leitura, sem inventar contrato).
 */
export function useDentistOptions() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  const adminQuery = useQuery({
    queryKey: appointmentKeys.dentists,
    queryFn: listDentists,
    enabled: isAdmin,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const derivedQuery = useQuery({
    queryKey: [...appointmentKeys.dentists, "derived"] as const,
    queryFn: () => listAppointments({ page: 1, pageSize: 100, includeCanceled: true }),
    enabled: !isAdmin && Boolean(user),
    staleTime: 60_000,
  });

  const dentists: Dentist[] = isAdmin
    ? adminQuery.data ?? []
    : dedupeDentists(derivedQuery.data?.items ?? []);

  return {
    dentists,
    isLoading: isAdmin ? adminQuery.isLoading : derivedQuery.isLoading,
  };
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AppointmentCreateInput) => createAppointment(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: appointmentKeys.all }),
  });
}

export function useRescheduleAppointment(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AppointmentRescheduleInput) => rescheduleAppointment(id, input),
    onSuccess: (appt) => {
      qc.setQueryData(appointmentKeys.detail(id), appt);
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}

export function useCancelAppointment(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cancellationReason: string | null) => cancelAppointment(id, cancellationReason),
    onSuccess: (appt) => {
      qc.setQueryData(appointmentKeys.detail(id), appt);
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}

export function useChangeAppointmentStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: AppointmentStatus) => changeAppointmentStatus(id, status),
    onSuccess: (appt) => {
      qc.setQueryData(appointmentKeys.detail(id), appt);
      qc.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}
