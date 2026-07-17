import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { FeatureCard } from "../feature-card";
import { SettingsItem } from "../settings-item";

export interface SystemInfoRow {
  label: string;
  description?: string;
  value: ReactNode;
}

/**
 * Card de informações somente leitura (rótulo → valor), usado pelas seções
 * "Sobre o sistema" e "Informações técnicas". Valores ausentes chegam como
 * "—" — nunca inventados.
 */
export function SystemInfoCard({
  icon,
  title,
  description,
  rows,
  badge,
  actions,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  rows: SystemInfoRow[];
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <FeatureCard
      icon={icon}
      title={title}
      description={description}
      badge={badge}
      actions={actions}
      flush
    >
      {rows.map((row) => (
        <SettingsItem
          key={row.label}
          label={row.label}
          description={row.description}
          control={
            typeof row.value === "string" ? (
              <span className="text-sm tabular-nums text-ink-soft">{row.value}</span>
            ) : (
              row.value
            )
          }
        />
      ))}
    </FeatureCard>
  );
}
