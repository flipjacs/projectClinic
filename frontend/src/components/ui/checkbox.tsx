import { Check } from "lucide-react";
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/utils/cn";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  /** Linha de apoio discreta abaixo do rótulo. */
  description?: string;
  className?: string;
}

/**
 * Checkbox do design system. O input nativo fica invisível (sr-only) e a caixa
 * é desenhada ao lado — dourada quando marcada, com anel de foco visível e
 * transição suave. O rótulo faz parte da área clicável.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className, disabled, ...props }, ref) => {
    return (
      <label
        className={cn(
          "group flex select-none items-start gap-2.5 text-sm",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          className,
        )}
      >
        <input type="checkbox" ref={ref} disabled={disabled} className="peer sr-only" {...props} />
        <span
          aria-hidden
          className={cn(
            "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px]",
            "border border-graphite-200 bg-white shadow-sm",
            "transition-[background-color,border-color,box-shadow] duration-150 ease-out-quint",
            "group-hover:border-gold-400",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-gold-400 peer-focus-visible:ring-offset-2",
            "peer-checked:border-gold-500 peer-checked:bg-gold-500",
            "peer-checked:[&>svg]:scale-100 peer-checked:[&>svg]:opacity-100",
          )}
        >
          <Check
            className="h-3 w-3 scale-75 text-white opacity-0 transition-[opacity,transform] duration-150 ease-out-quint"
            strokeWidth={3}
          />
        </span>
        {(label || description) && (
          <span className="min-w-0">
            {label && <span className="block font-medium text-ink-soft">{label}</span>}
            {description && <span className="mt-0.5 block text-xs text-ink-mute">{description}</span>}
          </span>
        )}
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";
