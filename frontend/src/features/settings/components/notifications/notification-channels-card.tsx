import { Send } from "lucide-react";

import { FeatureCard } from "../feature-card";
import { NOTIFICATION_CHANNELS } from "./config";
import { NotificationChannel } from "./notification-channel";

/** Canais por onde os avisos serão enviados e o estado de cada um. */
export function NotificationChannelsCard() {
  return (
    <FeatureCard
      icon={Send}
      title="Canais de envio"
      description="Por onde os avisos chegam a pacientes e equipe."
      flush
    >
      {NOTIFICATION_CHANNELS.map((channel) => (
        <NotificationChannel key={channel.key} channel={channel} />
      ))}
    </FeatureCard>
  );
}
