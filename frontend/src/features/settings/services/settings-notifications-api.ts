import axios from "axios";

import { api } from "@/lib/api";
import type { NotificationSettingsFormValues } from "../schemas/notifications-schema";

/**
 * Client HTTP das Configurações de Notificações.
 *
 * O backend AINDA NÃO expõe estes endpoints — contrato definido aqui (paths +
 * DTO snake_case) para a UI operar desacoplada. GET 404 = "nada salvo";
 * escrita falha com mensagem honesta até o backend chegar.
 */

const NOTIFICATIONS_PATH = "/settings/notifications";

/** DTO no formato do backend (snake_case, padrão dos outros módulos). */
export interface NotificationSettingsDto {
  appointments: {
    remind_24h: boolean;
    remind_2h: boolean;
    remind_30min: boolean;
    confirmation_message: boolean;
  };
  finance: {
    payment_overdue: boolean;
    payment_received: boolean;
    new_budget: boolean;
    reminder_cancelled: boolean;
  };
  inventory: {
    low_stock: boolean;
    product_expiring: boolean;
    auto_replenishment: boolean;
  };
  system: {
    updates: boolean;
    critical_failures: boolean;
    backup_completed: boolean;
    integrations: boolean;
  };
}

// ---------------------------------------------------------------------------
// Mappers DTO ⇄ formulário
// ---------------------------------------------------------------------------

export function toNotificationFormValues(
  dto: NotificationSettingsDto,
): NotificationSettingsFormValues {
  return {
    appointments: {
      remind24h: dto.appointments.remind_24h,
      remind2h: dto.appointments.remind_2h,
      remind30min: dto.appointments.remind_30min,
      confirmationMessage: dto.appointments.confirmation_message,
    },
    finance: {
      paymentOverdue: dto.finance.payment_overdue,
      paymentReceived: dto.finance.payment_received,
      newBudget: dto.finance.new_budget,
      reminderCancelled: dto.finance.reminder_cancelled,
    },
    inventory: {
      lowStock: dto.inventory.low_stock,
      productExpiring: dto.inventory.product_expiring,
      autoReplenishment: dto.inventory.auto_replenishment,
    },
    system: {
      updates: dto.system.updates,
      criticalFailures: dto.system.critical_failures,
      backupCompleted: dto.system.backup_completed,
      integrations: dto.system.integrations,
    },
  };
}

export function toNotificationPayload(
  values: NotificationSettingsFormValues,
): NotificationSettingsDto {
  return {
    appointments: {
      remind_24h: values.appointments.remind24h,
      remind_2h: values.appointments.remind2h,
      remind_30min: values.appointments.remind30min,
      confirmation_message: values.appointments.confirmationMessage,
    },
    finance: {
      payment_overdue: values.finance.paymentOverdue,
      payment_received: values.finance.paymentReceived,
      new_budget: values.finance.newBudget,
      reminder_cancelled: values.finance.reminderCancelled,
    },
    inventory: {
      low_stock: values.inventory.lowStock,
      product_expiring: values.inventory.productExpiring,
      auto_replenishment: values.inventory.autoReplenishment,
    },
    system: {
      updates: values.system.updates,
      critical_failures: values.system.criticalFailures,
      backup_completed: values.system.backupCompleted,
      integrations: values.system.integrations,
    },
  };
}

// ---------------------------------------------------------------------------
// Chamadas HTTP
// ---------------------------------------------------------------------------

/** `null` = nada salvo ainda (ou endpoint ainda não implantado). */
export async function getNotificationSettings(): Promise<NotificationSettingsFormValues | null> {
  try {
    const { data } = await api.get<NotificationSettingsDto>(NOTIFICATIONS_PATH);
    return toNotificationFormValues(data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

export async function updateNotificationSettings(
  values: NotificationSettingsFormValues,
): Promise<NotificationSettingsFormValues> {
  const { data } = await api.put<NotificationSettingsDto>(
    NOTIFICATIONS_PATH,
    toNotificationPayload(values),
  );
  return toNotificationFormValues(data);
}
