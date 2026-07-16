import { useMemo } from "react";

import { cn } from "@/utils/cn";

/**
 * Medidor de força de senha — apenas um reforço visual local (nunca envia ou
 * registra a senha em lugar algum). Os critérios espelham as regras do backend
 * (8+ caracteres, letras e números) e somam variedade opcional (maiúsculas,
 * símbolos) para orientar uma senha mais forte.
 */
function scorePassword(value: string): number {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^a-zA-Z0-9]/.test(value)) score++;
  return Math.min(score, 4);
}

const LEVELS = [
  { label: "Muito fraca", bar: "bg-danger-500", text: "text-danger-600" },
  { label: "Fraca", bar: "bg-danger-500", text: "text-danger-600" },
  { label: "Razoável", bar: "bg-warning-500", text: "text-warning-600" },
  { label: "Boa", bar: "bg-success-500", text: "text-success-600" },
  { label: "Forte", bar: "bg-success-600", text: "text-success-700" },
] as const;

export function PasswordStrength({ value }: { value: string }) {
  const score = useMemo(() => scorePassword(value), [value]);
  if (!value) return null;
  const level = LEVELS[score];

  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-200",
              i < Math.max(score, 1) ? level.bar : "bg-graphite-200",
            )}
          />
        ))}
      </div>
      <p className={cn("mt-1 text-xs font-medium", level.text)}>
        Força da senha: {level.label}
      </p>
    </div>
  );
}
