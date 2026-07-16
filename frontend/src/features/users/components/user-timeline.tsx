import { Clock, History, PencilLine, UserPlus, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { formatDateTime } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { User } from "../types/user";

interface TimelineEvent {
  id: string;
  icon: LucideIcon;
  title: string;
  timestamp?: string;
  description?: ReactNode;
  tone?: "gold" | "neutral";
  /** Evento ainda não disponível no backend (placeholder de integração). */
  pending?: boolean;
}

function TimelineRow({ event, last }: { event: TimelineEvent; last: boolean }) {
  const Icon = event.icon;
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!last && (
        <span
          aria-hidden
          className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-line"
        />
      )}
      <span
        className={cn(
          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white",
          event.pending
            ? "bg-graphite-100 text-graphite-400"
            : event.tone === "gold"
              ? "bg-gold-100 text-gold-700"
              : "bg-graphite-100 text-graphite-500",
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className={cn("text-sm font-medium", event.pending ? "text-ink-mute" : "text-ink")}>
          {event.title}
        </p>
        {event.timestamp && (
          <p className="mt-0.5 text-xs text-ink-mute">{formatDateTime(event.timestamp)}</p>
        )}
        {event.description && (
          <div className="mt-1 text-xs text-ink-mute">{event.description}</div>
        )}
      </div>
    </li>
  );
}

/**
 * Linha do tempo do usuário. Hoje o contrato expõe apenas `created_at` e
 * `updated_at`, então mostramos esses dois marcos reais. O histórico detalhado
 * (troca de cargo, ativações, último login) é registrado no backend, mas ainda
 * não há endpoint de leitura — deixamos o marco preparado para quando existir,
 * sem inventar eventos.
 */
export function UserTimeline({ user }: { user: User }) {
  const changed = user.updated_at && user.updated_at !== user.created_at;

  const events: TimelineEvent[] = [
    {
      id: "created",
      icon: UserPlus,
      title: "Conta criada",
      timestamp: user.created_at,
      tone: "gold",
    },
  ];

  if (changed) {
    events.push({
      id: "updated",
      icon: PencilLine,
      title: "Última atualização de dados",
      timestamp: user.updated_at,
      tone: "neutral",
    });
  }

  events.push({
    id: "history",
    icon: History,
    title: "Histórico detalhado",
    pending: true,
    description:
      "Trocas de cargo, ativações e acessos aparecerão aqui quando a auditoria for exposta pela API.",
  });

  return (
    <div>
      <ul>
        {events.map((event, i) => (
          <TimelineRow key={event.id} event={event} last={i === events.length - 1} />
        ))}
      </ul>

      <div className="mt-2 flex items-center gap-2 rounded-lg bg-canvas/60 px-3 py-2 text-xs text-ink-mute">
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Último acesso ainda não é registrado pelo sistema.
      </div>
    </div>
  );
}
