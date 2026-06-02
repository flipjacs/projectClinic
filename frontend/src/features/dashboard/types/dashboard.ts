export interface DashboardPatientSnapshot {
  id: number;
  name: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

export interface DentistSnapshot {
  id: number;
  name: string;
}

export interface DashboardAppointmentSnapshot {
  id: number;
  patient_id: number;
  dentist_id: number;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  reason?: string | null;
  patient: DashboardPatientSnapshot;
  dentist: DentistSnapshot;
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

  // Financeiro — Optional: o backend só envia conforme a permissão da role.
  monthly_revenue?: number | string | null;
  weekly_revenue?: number | string | null;
  pending_payments_total?: number | string | null;
  pending_payments_count?: number | null;

  low_stock_items_count: number;
  expiring_items_count: number;

  most_recent_patients: DashboardPatientSnapshot[];
  upcoming_appointments: DashboardAppointmentSnapshot[];
}
