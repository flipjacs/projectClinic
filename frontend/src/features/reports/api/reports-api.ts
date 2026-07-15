import { api } from "@/lib/api";
import type { ResolvedRange } from "../utils/period";
import type {
  AppointmentsReport,
  DashboardResponse,
  FinanceReport,
  InventoryReport,
  PatientsReport,
} from "../types/reports";

export async function getDashboard(): Promise<DashboardResponse> {
  const { data } = await api.get<DashboardResponse>("/dashboard");
  return data;
}

export async function getPatientsReport(range: ResolvedRange): Promise<PatientsReport> {
  const { data } = await api.get<PatientsReport>("/reports/patients", {
    params: { start_date: range.start_date, end_date: range.end_date },
  });
  return data;
}

export async function getAppointmentsReport(
  range: ResolvedRange,
  dentistId?: number,
): Promise<AppointmentsReport> {
  const { data } = await api.get<AppointmentsReport>("/reports/appointments", {
    params: {
      start_date: range.start_date,
      end_date: range.end_date,
      dentist_id: dentistId || undefined,
    },
  });
  return data;
}

export async function getFinanceReport(range: ResolvedRange): Promise<FinanceReport> {
  const { data } = await api.get<FinanceReport>("/reports/finance", {
    params: { start_date: range.start_date, end_date: range.end_date },
  });
  return data;
}

export async function getInventoryReport(range: ResolvedRange): Promise<InventoryReport> {
  const { data } = await api.get<InventoryReport>("/reports/inventory", {
    params: { start_date: range.start_date, end_date: range.end_date },
  });
  return data;
}

// ===== Exportação CSV =====

export type ExportKind = "patients" | "appointments" | "finance" | "inventory";

/**
 * Baixa o CSV de um relatório. Usa o cliente autenticado (Bearer) com
 * `responseType: blob` e dispara o download no navegador. O backend só suporta
 * `format=csv`; PDF/Excel ainda não estão disponíveis no contrato.
 */
export async function downloadReportCsv(
  kind: ExportKind,
  range: ResolvedRange,
  dentistId?: number,
): Promise<void> {
  const response = await api.get(`/reports/${kind}/export`, {
    responseType: "blob",
    params: {
      start_date: range.start_date,
      end_date: range.end_date,
      dentist_id: kind === "appointments" ? dentistId || undefined : undefined,
      format: "csv",
    },
  });

  const disposition = String(response.headers["content-disposition"] ?? "");
  const match = /filename="?([^"]+)"?/.exec(disposition);
  const filename = match?.[1] ?? `${kind}_${range.start_date}_${range.end_date}.csv`;

  const blob = new Blob([response.data as BlobPart], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
