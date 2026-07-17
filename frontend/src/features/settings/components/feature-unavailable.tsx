import { Hourglass } from "lucide-react";

/**
 * Aviso discreto de recurso ainda não disponível — usado dentro de cards que
 * já mostram a interface completa (2FA, sessões remotas, canais futuros).
 * Nunca um "em construção" genérico: diz o que falta e o que acontece depois.
 */
export function FeatureUnavailable({
  title = "Disponível em breve",
  description,
}: {
  title?: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-gold-200 bg-gold-50/50 px-3.5 py-3">
      <Hourglass className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden />
      <p className="text-xs leading-relaxed text-ink-soft">
        <span className="font-medium text-ink">{title}.</span> {description}
      </p>
    </div>
  );
}
