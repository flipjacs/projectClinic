import { makeAppointment } from "../factories/appointment-factory";
import { makeBudget, makeFinanceSummary, makePayment } from "../factories/finance-factory";
import { makeInventoryItem } from "../factories/inventory-factory";
import { makeMedicalRecord } from "../factories/medical-record-factory";
import { makePatient } from "../factories/patient-factory";
import { adminUser, dentistUser, receptionistUser } from "../factories/user-factory";

export const TEST_TOKENS = {
  admin: "admin-token",
  dentist: "dentist-token",
  receptionist: "receptionist-token",
  expired: "expired-token",
} as const;

export const users = {
  admin: adminUser,
  dentist: dentistUser,
  receptionist: receptionistUser,
};

export const patients = [makePatient()];
export const appointments = [makeAppointment()];
export const medicalRecords = [makeMedicalRecord()];
export const budgets = [makeBudget()];
export const payments = [makePayment()];
export const financeSummary = makeFinanceSummary();
export const inventoryItems = [makeInventoryItem()];

export const dashboard = {
  period_week_start: "2026-01-05T00:00:00Z",
  period_week_end: "2026-01-12T00:00:00Z",
  period_month_start: "2026-01-01T00:00:00Z",
  period_month_end: "2026-02-01T00:00:00Z",
  total_patients: 12,
  active_patients: 10,
  inactive_patients: 2,
  appointments_today: 3,
  appointments_this_week: 14,
  completed_appointments_this_week: 8,
  canceled_appointments_this_week: 1,
  no_show_appointments_this_week: 1,
  monthly_revenue: "12500.00",
  weekly_revenue: "3200.00",
  pending_payments_total: "1800.00",
  pending_payments_count: 3,
  low_stock_items_count: 2,
  expiring_items_count: 1,
  most_recent_patients: patients.map((patient) => ({
    id: patient.id,
    name: patient.name,
    phone: patient.phone,
    is_active: patient.is_active,
    created_at: patient.created_at,
  })),
  upcoming_appointments: appointments.map((appointment) => ({
    id: appointment.id,
    patient_id: appointment.patient_id,
    dentist_id: appointment.dentist_id,
    scheduled_start: appointment.scheduled_start,
    scheduled_end: appointment.scheduled_end,
    status: appointment.status,
    reason: appointment.reason,
    patient: {
      id: appointment.patient.id,
      name: appointment.patient.name,
      phone: "5592999990000",
      is_active: true,
      created_at: "2026-01-10T12:00:00Z",
    },
    dentist: appointment.dentist,
  })),
};

export function page<T>(items: T[], pageNumber = 1, pageSize = 20) {
  return {
    items,
    meta: {
      page: pageNumber,
      page_size: pageSize,
      total: items.length,
      total_pages: items.length === 0 ? 0 : Math.ceil(items.length / pageSize),
    },
  };
}
