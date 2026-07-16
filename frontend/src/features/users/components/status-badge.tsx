import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

/**
 * Status do usuário: ativo (verde) ou inativo (neutro). Um ponto colorido
 * antecede o rótulo — reforço visual que não substitui o texto (acessibilidade).
 * O contrato só expõe `is_active`; não há estado de "convite pendente".
 */
export function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge tone={active ? "success" : "neutral"} className="gap-1.5">
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-success-500" : "bg-graphite-400",
        )}
      />
      {active ? "Ativo" : "Inativo"}
    </Badge>
  );
}
