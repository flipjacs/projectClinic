import { History } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/utils/format";
import { useSecurityAudit } from "../../hooks/use-security-settings";
import type { SecurityAuditInfo } from "../../schemas/security-schema";
import { FeatureCard } from "../feature-card";
import { SettingsItem } from "../settings-item";

const AUDIT_ROWS: {
  key: keyof SecurityAuditInfo;
  label: string;
  description: string;
  kind: "date" | "count";
}[] = [
  {
    key: "lastPasswordChange",
    label: "Última alteração de senha",
    description: "Da sua conta de administrador.",
    kind: "date",
  },
  {
    key: "lastLogin",
    label: "Último login",
    description: "Acesso mais recente registrado.",
    kind: "date",
  },
  {
    key: "lastSettingsChange",
    label: "Última alteração de configurações",
    description: "Qualquer mudança nesta área.",
    kind: "date",
  },
  {
    key: "recentEventsCount",
    label: "Eventos recentes",
    description: "Ações sensíveis nos últimos 30 dias.",
    kind: "count",
  },
];

function AuditValue({
  value,
  kind,
  isLoading,
}: {
  value: string | number | null;
  kind: "date" | "count";
  isLoading: boolean;
}) {
  if (isLoading) return <Skeleton className="h-4 w-24" />;
  if (value === null || value === undefined) {
    return <span className="text-sm text-ink-mute">—</span>;
  }
  return (
    <span className="text-sm font-medium tabular-nums text-ink-soft">
      {kind === "date" ? formatDateTime(String(value)) : value}
    </span>
  );
}

/** Resumo de auditoria — preenchido pelo backend quando o recurso existir. */
export function AuditCard() {
  const audit = useSecurityAudit();
  const hasData = Boolean(audit.data);

  return (
    <FeatureCard
      icon={History}
      title="Auditoria"
      description="Registro das ações sensíveis da sua conta e do sistema."
      badge={!hasData && !audit.isLoading ? <Badge tone="gold">Em breve</Badge> : undefined}
      flush
    >
      {AUDIT_ROWS.map((row) => (
        <SettingsItem
          key={row.key}
          label={row.label}
          description={row.description}
          control={
            <AuditValue
              value={audit.data?.[row.key] ?? null}
              kind={row.kind}
              isLoading={audit.isLoading}
            />
          }
        />
      ))}
    </FeatureCard>
  );
}
