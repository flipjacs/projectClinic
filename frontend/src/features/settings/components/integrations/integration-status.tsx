import { cn } from "@/utils/cn";

export type IntegrationStatusKind =
  | "connected"
  | "disconnected"
  | "error"
  | "soon"
  | "planned";

const STATUS_META: Record<IntegrationStatusKind, { label: string; dot: string; text: string }> = {
  connected: { label: "Conectado", dot: "bg-success-600", text: "text-success-700" },
  disconnected: { label: "Não conectado", dot: "bg-graphite-300", text: "text-ink-mute" },
  error: { label: "Com erro", dot: "bg-danger-600", text: "text-danger-700" },
  soon: { label: "Em breve", dot: "bg-gold-500", text: "text-gold-700" },
  planned: { label: "Planejado", dot: "bg-graphite-300", text: "text-ink-mute" },
};

/**
 * Indicador de estado de uma integração: ponto de cor + rótulo textual
 * (o significado nunca depende só da cor).
 */
export function IntegrationStatus({ status }: { status: IntegrationStatusKind }) {
  const meta = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", meta.text)}>
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}
