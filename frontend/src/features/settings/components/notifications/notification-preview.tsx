import { m } from "framer-motion";
import { MessageSquareText } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

import { EASE } from "@/lib/motion";
import { cn } from "@/utils/cn";
import type { NotificationSettingsFormValues } from "../../schemas/notifications-schema";

/** Trecho variável da mensagem — preenchido com dados reais no envio. */
function Placeholder({ children }: { children: string }) {
  return (
    <span className="rounded bg-gold-100/80 px-1 font-medium text-gold-800">{children}</span>
  );
}

/**
 * Pré-visualização do lembrete de 24h como o paciente receberá. Acompanha o
 * switch ao vivo: desligado, a mensagem esmaece — o efeito de cada opção
 * fica visível sem precisar salvar.
 */
export function NotificationPreview() {
  const { control } = useFormContext<NotificationSettingsFormValues>();
  const enabled = useWatch({ control, name: "appointments.remind24h" });

  return (
    <div className="px-5 py-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-ink-mute">
        <MessageSquareText className="h-3.5 w-3.5" aria-hidden />
        Pré-visualização do lembrete de 24 horas
      </p>
      <m.div
        animate={{ opacity: enabled ? 1 : 0.45, transition: { duration: 0.25, ease: EASE } }}
        className={cn(
          "relative mt-2.5 max-w-md rounded-2xl rounded-tl-md border border-gold-200 bg-gold-50/70 px-4 py-3",
        )}
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          Olá, <Placeholder>{"{paciente}"}</Placeholder>! Lembrete da sua consulta na{" "}
          <Placeholder>{"{clínica}"}</Placeholder> amanhã, dia{" "}
          <Placeholder>{"{data}"}</Placeholder> às <Placeholder>{"{hora}"}</Placeholder>.
          Se precisar remarcar, é só responder esta mensagem.
        </p>
      </m.div>
      <p className="mt-2 text-[11px] text-ink-mute" role="status">
        {enabled
          ? "Os campos destacados são preenchidos com os dados da consulta."
          : "Lembrete de 24 horas desativado — esta mensagem não será enviada."}
      </p>
    </div>
  );
}
