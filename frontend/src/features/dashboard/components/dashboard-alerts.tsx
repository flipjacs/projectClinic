import { AlertCircle, CalendarX2, PackageX, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";
import type { DashboardResponse } from "../types/dashboard";

interface AlertRow {
  icon: LucideIcon;
  label: string;
  detail: string;
}

export function DashboardAlerts({ data }: { data: DashboardResponse }) {
  const alerts: AlertRow[] = [];

  if (data.low_stock_items_count > 0) {
    alerts.push({
      icon: PackageX,
      label: "Estoque baixo",
      detail: `${data.low_stock_items_count} item(ns) abaixo do mínimo`,
    });
  }
  if (data.expiring_items_count > 0) {
    alerts.push({
      icon: AlertCircle,
      label: "Itens a vencer",
      detail: `${data.expiring_items_count} item(ns) próximos do vencimento`,
    });
  }
  if (data.canceled_appointments_this_week > 0 || data.no_show_appointments_this_week > 0) {
    alerts.push({
      icon: CalendarX2,
      label: "Cancelamentos / faltas (semana)",
      detail: `${data.canceled_appointments_this_week} cancelada(s), ${data.no_show_appointments_this_week} falta(s)`,
    });
  }
  // Financeiro só aparece se o backend enviou (depende da permissão).
  if (data.pending_payments_count != null && data.pending_payments_count > 0) {
    alerts.push({
      icon: Wallet,
      label: "Pagamentos pendentes",
      detail: `${data.pending_payments_count} pendência(s) · ${formatCurrency(
        data.pending_payments_total,
      )}`,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas</CardTitle>
      </CardHeader>
      <CardBody className="p-0">
        {alerts.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={AlertCircle}
              title="Tudo em ordem"
              description="Nenhum alerta no momento."
            />
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {alerts.map((alert, i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <alert.icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{alert.label}</p>
                  <p className="truncate text-xs text-gray-500">{alert.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
