import { useId, type ReactNode } from "react";

import { cn } from "@/utils/cn";

interface FormFieldProps {
  label: string;
  /** Renderiza o controle recebendo o id para o htmlFor do label. */
  children: (id: string) => ReactNode;
  error?: string;
  hint?: string;
  className?: string;
}

/**
 * Envólucro de campo para controles que não são os primitivos padrão
 * (Input/Select/Textarea já trazem o próprio label). Garante label associado,
 * mensagem de erro e dica de forma consistente e acessível.
 */
export function FormField({ label, children, error, hint, className }: FormFieldProps) {
  const id = useId();
  const descId = `${id}-desc`;
  return (
    <div className={cn("w-full", className)}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      {children(id)}
      {error ? (
        <p id={descId} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={descId} className="mt-1 text-xs text-ink-mute">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
