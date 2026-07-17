import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import type { NotificationSettingsFormValues } from "../../schemas/notifications-schema";
import { FeatureCard } from "../feature-card";
import { FormSwitchRow } from "../form";
import type { NotificationGroupConfig } from "./config";
import { NotificationPreview } from "./notification-preview";

/**
 * Card de um grupo de avisos, montado a partir da configuração declarativa.
 * Cada switch assina só o próprio campo; o card em si nunca re-renderiza ao
 * alternar opções.
 */
export const NotificationGroupCard = memo(function NotificationGroupCard({
  group,
}: {
  group: NotificationGroupConfig;
}) {
  return (
    <FeatureCard
      icon={group.icon}
      title={group.title}
      description={group.description}
      flush
    >
      {group.switches.map((item) => (
        <FormSwitchRow<NotificationSettingsFormValues>
          key={item.name}
          name={item.name}
          label={item.label}
          description={item.description}
          disabled={item.soon}
          badge={item.soon ? <Badge tone="gold">Em breve</Badge> : undefined}
        />
      ))}
      {group.withPreview && <NotificationPreview />}
    </FeatureCard>
  );
});
