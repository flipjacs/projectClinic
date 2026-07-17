import { z } from "zod";

/**
 * Contrato do formulário Configurações → Notificações. Cada grupo espelha um
 * card da página; adicionar um aviso novo = um boolean aqui + uma linha na
 * config de cards.
 */

export const notificationSettingsSchema = z.object({
  appointments: z.object({
    remind24h: z.boolean(),
    remind2h: z.boolean(),
    remind30min: z.boolean(),
    confirmationMessage: z.boolean(),
  }),
  finance: z.object({
    paymentOverdue: z.boolean(),
    paymentReceived: z.boolean(),
    newBudget: z.boolean(),
    reminderCancelled: z.boolean(),
  }),
  inventory: z.object({
    lowStock: z.boolean(),
    productExpiring: z.boolean(),
    autoReplenishment: z.boolean(),
  }),
  system: z.object({
    updates: z.boolean(),
    criticalFailures: z.boolean(),
    backupCompleted: z.boolean(),
    integrations: z.boolean(),
  }),
});

export type NotificationSettingsFormValues = z.infer<typeof notificationSettingsSchema>;

/** Padrões seguros: avisos clínicos/críticos ligados, opcionais desligados. */
export function defaultNotificationSettings(): NotificationSettingsFormValues {
  return {
    appointments: {
      remind24h: true,
      remind2h: false,
      remind30min: false,
      confirmationMessage: true,
    },
    finance: {
      paymentOverdue: true,
      paymentReceived: false,
      newBudget: true,
      reminderCancelled: true,
    },
    inventory: {
      lowStock: true,
      productExpiring: true,
      autoReplenishment: false,
    },
    system: {
      updates: false,
      criticalFailures: true,
      backupCompleted: false,
      integrations: false,
    },
  };
}

// ---------------------------------------------------------------------------
// Canais de envio (informativos — disponibilidade controlada pelo produto)
// ---------------------------------------------------------------------------

export type ChannelAvailability = "available" | "planned" | "soon";

export interface NotificationChannelInfo {
  key: string;
  name: string;
  description: string;
  availability: ChannelAvailability;
}
