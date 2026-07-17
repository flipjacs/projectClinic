import { MonitorSmartphone } from "lucide-react";
import { useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTerminateSessions } from "../../hooks/use-security-settings";
import { FeatureCard } from "../feature-card";
import { FeatureUnavailable } from "../feature-unavailable";
import { describeCurrentSession } from "./session-info";

type TerminateScope = "others" | "all";

const CONFIRM_COPY: Record<TerminateScope, { title: string; message: string; cta: string }> = {
  others: {
    title: "Encerrar as outras sessões?",
    message:
      "Todos os outros dispositivos conectados com a sua conta serão desconectados. Esta sessão continua ativa.",
    cta: "Encerrar outras sessões",
  },
  all: {
    title: "Encerrar todas as sessões?",
    message:
      "Todos os dispositivos serão desconectados, inclusive este. Você precisará entrar novamente.",
    cta: "Encerrar todas",
  },
};

/** Sessão atual (dados do próprio navegador) e encerramento de sessões. */
export function SecuritySessionCard() {
  const [pending, setPending] = useState<TerminateScope | null>(null);
  const terminate = useTerminateSessions();
  const session = useMemo(() => describeCurrentSession(navigator.userAgent), []);

  function confirm() {
    if (!pending) return;
    terminate.mutate(pending, { onSettled: () => setPending(null) });
  }

  return (
    <FeatureCard
      icon={MonitorSmartphone}
      title="Sessões"
      description="Dispositivos conectados com a sua conta."
      flush
    >
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-ink">{session.browser}</p>
            <Badge tone="success">Sessão atual</Badge>
          </div>
          <p className="mt-0.5 text-sm text-ink-mute">
            {session.os} · Ativa agora · IP não informado
          </p>
        </div>
      </div>

      <div className="space-y-3 px-5 py-4">
        <FeatureUnavailable description="A lista completa de dispositivos conectados aparecerá aqui quando o servidor passar a registrar sessões." />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPending("others")}
            disabled={terminate.isPending}
          >
            Encerrar outras sessões
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="border-danger-200 text-danger-700 hover:bg-danger-50 active:bg-danger-100"
            onClick={() => setPending("all")}
            disabled={terminate.isPending}
          >
            Encerrar todas as sessões
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={pending !== null}
        tone="danger"
        title={pending ? CONFIRM_COPY[pending].title : ""}
        message={pending ? CONFIRM_COPY[pending].message : ""}
        confirmLabel={pending ? CONFIRM_COPY[pending].cta : undefined}
        isLoading={terminate.isPending}
        onConfirm={confirm}
        onClose={() => setPending(null)}
      />
    </FeatureCard>
  );
}
