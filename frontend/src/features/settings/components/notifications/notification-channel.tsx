import { Bell, Mail, MessageCircle, Smartphone, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type {
  ChannelAvailability,
  NotificationChannelInfo,
} from "../../schemas/notifications-schema";

const CHANNEL_ICONS: Record<string, LucideIcon> = {
  email: Mail,
  whatsapp: MessageCircle,
  sms: Smartphone,
  push: Bell,
};

const AVAILABILITY_BADGE: Record<
  ChannelAvailability,
  { tone: "success" | "gold" | "neutral"; label: string }
> = {
  available: { tone: "success", label: "Disponível" },
  soon: { tone: "gold", label: "Em breve" },
  planned: { tone: "neutral", label: "Planejado" },
};

/** Linha de um canal de envio com sua disponibilidade atual. */
export function NotificationChannel({ channel }: { channel: NotificationChannelInfo }) {
  const Icon = CHANNEL_ICONS[channel.key] ?? Bell;
  const badge = AVAILABILITY_BADGE[channel.availability];

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-graphite-50 text-ink-soft ring-1 ring-inset ring-line"
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{channel.name}</p>
          <p className="mt-0.5 text-sm text-ink-mute">{channel.description}</p>
        </div>
      </div>
      <Badge tone={badge.tone}>{badge.label}</Badge>
    </div>
  );
}
