import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/utils/cn";

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  /** Linha de apoio discreta abaixo do rótulo. */
  description?: string;
  className?: string;
}

/**
 * Interruptor (switch) do design system — para ligar/desligar seções ou
 * preferências. Por baixo é um checkbox nativo (semântica e formulários
 * intactos) com `role="switch"`; por cima, uma pílula deslizante dourada.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, className, disabled, ...props }, ref) => {
    return (
      <label
        className={cn(
          "group flex select-none items-start gap-2.5 text-sm",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          className,
        )}
      >
        <input
          type="checkbox"
          role="switch"
          ref={ref}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <span
          aria-hidden
          className={cn(
            "relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-graphite-200",
            "transition-colors duration-200 ease-out-quint",
            "group-hover:bg-graphite-300",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-gold-400 peer-focus-visible:ring-offset-2",
            "peer-checked:bg-gold-500 peer-checked:group-hover:bg-gold-600",
            "after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full",
            "after:bg-surface after:shadow-sm after:transition-transform after:duration-200 after:ease-out-quint",
            "peer-checked:after:translate-x-4",
          )}
        />
        {(label || description) && (
          <span className="min-w-0">
            {label && <span className="block font-medium text-ink">{label}</span>}
            {description && <span className="mt-0.5 block text-xs text-ink-mute">{description}</span>}
          </span>
        )}
      </label>
    );
  },
);
Switch.displayName = "Switch";
