import { CalendarClock, MonitorCog, Package, Wallet, type LucideIcon } from "lucide-react";
import type { FieldPath } from "react-hook-form";

import type {
  NotificationChannelInfo,
  NotificationSettingsFormValues,
} from "../../schemas/notifications-schema";

/**
 * Configuração declarativa dos cards de Notificações. Adicionar um aviso =
 * um boolean no schema + uma linha aqui. Nenhum componente muda.
 */

export interface NotificationSwitchConfig {
  name: FieldPath<NotificationSettingsFormValues>;
  label: string;
  description: string;
  /** Recurso ainda sem suporte: switch visível porém inerte + badge. */
  soon?: boolean;
}

export interface NotificationGroupConfig {
  key: string;
  icon: LucideIcon;
  title: string;
  description: string;
  switches: NotificationSwitchConfig[];
  /** Mostra a pré-visualização da mensagem (card de lembretes). */
  withPreview?: boolean;
}

export const NOTIFICATION_GROUPS: NotificationGroupConfig[] = [
  {
    key: "appointments",
    icon: CalendarClock,
    title: "Lembretes de consulta",
    description: "Avisos automáticos enviados aos pacientes.",
    withPreview: true,
    switches: [
      {
        name: "appointments.remind24h",
        label: "Lembrete 24 horas antes",
        description: "O paciente é avisado um dia antes da consulta.",
      },
      {
        name: "appointments.remind2h",
        label: "Lembrete 2 horas antes",
        description: "Reforço no dia, com tempo de deslocamento.",
      },
      {
        name: "appointments.remind30min",
        label: "Lembrete 30 minutos antes",
        description: "Último aviso, próximo ao horário marcado.",
      },
      {
        name: "appointments.confirmationMessage",
        label: "Mensagem de confirmação",
        description: "Confirmação enviada assim que a consulta é agendada.",
      },
    ],
  },
  {
    key: "finance",
    icon: Wallet,
    title: "Financeiro",
    description: "Avisos sobre pagamentos e orçamentos para a equipe.",
    switches: [
      {
        name: "finance.paymentOverdue",
        label: "Pagamento vencido",
        description: "Alerta quando um pagamento passa do vencimento.",
      },
      {
        name: "finance.paymentReceived",
        label: "Pagamento recebido",
        description: "Confirmação de cada recebimento registrado.",
      },
      {
        name: "finance.newBudget",
        label: "Novo orçamento",
        description: "Aviso quando um orçamento é criado ou aprovado.",
      },
      {
        name: "finance.reminderCancelled",
        label: "Cancelamento de lembrete",
        description: "Informa quando um lembrete de cobrança é cancelado.",
      },
    ],
  },
  {
    key: "inventory",
    icon: Package,
    title: "Estoque",
    description: "Alertas de materiais para a equipe responsável.",
    switches: [
      {
        name: "inventory.lowStock",
        label: "Baixo estoque",
        description: "Alerta quando um item atinge o mínimo definido.",
      },
      {
        name: "inventory.productExpiring",
        label: "Produto vencendo",
        description: "Aviso antes de itens atingirem a validade.",
      },
      {
        name: "inventory.autoReplenishment",
        label: "Reposição automática",
        description: "Sugestão de compra gerada pelo sistema.",
        soon: true,
      },
    ],
  },
  {
    key: "system",
    icon: MonitorCog,
    title: "Sistema",
    description: "Avisos técnicos para administradores.",
    switches: [
      {
        name: "system.updates",
        label: "Atualizações",
        description: "Novidades de versão e melhorias do sistema.",
      },
      {
        name: "system.criticalFailures",
        label: "Falhas críticas",
        description: "Problemas que exigem ação imediata.",
      },
      {
        name: "system.backupCompleted",
        label: "Backup realizado",
        description: "Confirmação de cada cópia de segurança concluída.",
      },
      {
        name: "system.integrations",
        label: "Integrações",
        description: "Status de conexões com serviços externos.",
      },
    ],
  },
];

/** Canais de envio e disponibilidade atual de cada um. */
export const NOTIFICATION_CHANNELS: NotificationChannelInfo[] = [
  {
    key: "email",
    name: "E-mail",
    description: "Canal principal de envio dos avisos.",
    availability: "soon",
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    description: "Confirmações e lembretes direto no celular do paciente.",
    availability: "planned",
  },
  {
    key: "sms",
    name: "SMS",
    description: "Alternativa para pacientes sem internet.",
    availability: "planned",
  },
  {
    key: "push",
    name: "Notificações push",
    description: "Avisos instantâneos para a equipe no navegador.",
    availability: "planned",
  },
];
