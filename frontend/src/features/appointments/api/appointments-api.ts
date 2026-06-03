import { api } from "@/lib/api";
import type { Paginated, User } from "@/types/api";
import { ROLES } from "@/types/roles";
import type {
  Appointment,
  AppointmentCreateInput,
  AppointmentRescheduleInput,
  AppointmentStatus,
  Dentist,
} from "../types/appointment";

export interface ListAppointmentsParams {
  patientId?: number;
  dentistId?: number;
  status?: AppointmentStatus;
  /** Intervalo (ISO 8601 com timezone). */
  from?: string;
  to?: string;
  includeCanceled?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listAppointments(
  params: ListAppointmentsParams,
): Promise<Paginated<Appointment>> {
  const { data } = await api.get<Paginated<Appointment>>("/appointments", {
    params: {
      patient_id: params.patientId || undefined,
      dentist_id: params.dentistId || undefined,
      status: params.status || undefined,
      from: params.from || undefined,
      to: params.to || undefined,
      include_canceled: params.includeCanceled || undefined,
      page: params.page ?? 1,
      page_size: params.pageSize ?? 20,
    },
  });
  return data;
}

export interface TodayParams {
  dentistId?: number;
  includeCanceled?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listTodayAppointments(
  params: TodayParams = {},
): Promise<Paginated<Appointment>> {
  const { data } = await api.get<Paginated<Appointment>>("/appointments/today", {
    params: {
      dentist_id: params.dentistId || undefined,
      include_canceled: params.includeCanceled || undefined,
      page: params.page ?? 1,
      page_size: params.pageSize ?? 50,
    },
  });
  return data;
}

export async function getAppointment(id: number): Promise<Appointment> {
  const { data } = await api.get<Appointment>(`/appointments/${id}`);
  return data;
}

export async function createAppointment(
  input: AppointmentCreateInput,
): Promise<Appointment> {
  const { data } = await api.post<Appointment>("/appointments", input);
  return data;
}

export async function rescheduleAppointment(
  id: number,
  input: AppointmentRescheduleInput,
): Promise<Appointment> {
  const { data } = await api.patch<Appointment>(`/appointments/${id}/reschedule`, input);
  return data;
}

export async function cancelAppointment(
  id: number,
  cancellationReason: string | null,
): Promise<Appointment> {
  const { data } = await api.patch<Appointment>(`/appointments/${id}/cancel`, {
    cancellation_reason: cancellationReason,
  });
  return data;
}

export async function changeAppointmentStatus(
  id: number,
  status: AppointmentStatus,
): Promise<Appointment> {
  const { data } = await api.patch<Appointment>(`/appointments/${id}/status`, { status });
  return data;
}

/**
 * Lista profissionais clínicos via GET /users (ADMIN-only no backend). Para os
 * demais perfis, a lista de dentistas é derivada das consultas existentes
 * (ver useDentistOptions), pois não há endpoint público de dentistas.
 */
export async function listDentists(): Promise<Dentist[]> {
  const { data } = await api.get<Paginated<User>>("/users", {
    params: { page: 1, page_size: 100 },
  });
  return data.items
    .filter((u) => u.is_active && (u.role === ROLES.DENTIST || u.role === ROLES.ADMIN))
    .map((u) => ({ id: u.id, name: u.name }));
}
