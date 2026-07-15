/**
 * Tipos do módulo de Relatórios — espelham os schemas de `/reports/*` e
 * `/dashboard`. Valores monetários e quantidades chegam como Decimal em string.
 */
import type { PaymentMethod, PaymentStatus } from "@/features/finance/types/finance";

export interface PeriodMeta {
  start_date: string; // YYYY-MM-DD
  end_date: string;
}

export interface CountByLabel {
  label: string;
  count: number;
}

export interface CountByDay {
  day: string; // YYYY-MM-DD
  count: number;
}

export interface TotalByDay {
  day: string;
  total: string;
  count: number;
}

export interface TotalByLabel {
  label: string;
  total: string;
  count: number;
}

export interface CountByDentist {
  dentist_id: number;
  dentist_name: string;
  count: number;
}

export interface CountByPatient {
  patient_id: number;
  patient_name: string;
  count: number;
}

export interface MovedItem {
  inventory_item_id: number;
  name: string;
  total_in: string;
  total_out: string;
  movement_count: number;
}

// ===== Dashboard =====

export interface DashboardPatientSnapshot {
  id: number;
  name: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

export interface DashboardResponse {
  period_week_start: string;
  period_week_end: string;
  period_month_start: string;
  period_month_end: string;
  total_patients: number;
  active_patients: number;
  inactive_patients: number;
  appointments_today: number;
  appointments_this_week: number;
  completed_appointments_this_week: number;
  canceled_appointments_this_week: number;
  no_show_appointments_this_week: number;
  monthly_revenue: string | null;
  weekly_revenue: string | null;
  pending_payments_total: string | null;
  pending_payments_count: number | null;
  low_stock_items_count: number;
  expiring_items_count: number;
  most_recent_patients: DashboardPatientSnapshot[];
}

// ===== Patients report =====

export interface PatientSnapshot {
  id: number;
  name: string;
  cpf: string;
  phone: string;
  email: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PatientsReport {
  period: PeriodMeta;
  total_patients_created_in_period: number;
  active_patients: number;
  inactive_patients: number;
  patients_with_missing_contact_data: number;
  patients_by_city: CountByLabel[];
  recent_patients: PatientSnapshot[];
}

// ===== Appointments report =====

export interface AppointmentsReport {
  period: PeriodMeta;
  dentist_filter_applied: number | null;
  total_appointments: number;
  completed_appointments: number;
  canceled_appointments: number;
  no_show_appointments: number;
  appointments_by_status: CountByLabel[];
  appointments_by_dentist: CountByDentist[];
  appointments_by_day: CountByDay[];
  most_common_reasons: CountByLabel[];
}

// ===== Finance report =====

export interface PendingPaymentSnapshot {
  id: number;
  patient_id: number;
  budget_id: number | null;
  amount: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  due_date: string | null;
  created_at: string;
}

export interface FinanceReport {
  period: PeriodMeta;
  total_paid: string;
  total_pending: string;
  total_canceled: string;
  paid_payments_count: number;
  pending_payments_count: number;
  revenue_by_day: TotalByDay[];
  revenue_by_payment_method: TotalByLabel[];
  pending_payments: PendingPaymentSnapshot[];
}

// ===== Inventory report =====

export interface InventoryItemSnapshot {
  id: number;
  name: string;
  category: string;
  current_quantity: string;
  minimum_quantity: string;
  unit_of_measure: string;
  supplier: string | null;
  expiration_date: string | null;
  is_active: boolean;
}

export interface InventoryReport {
  period: PeriodMeta;
  total_active_items: number;
  total_inactive_items: number;
  low_stock_items_count: number;
  expiring_items_count: number;
  movements_by_type: CountByLabel[];
  most_moved_items: MovedItem[];
  low_stock_items: InventoryItemSnapshot[];
  expiring_items: InventoryItemSnapshot[];
}
