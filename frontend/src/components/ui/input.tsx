import { forwardRef, useId, type InputHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/** Classe base compartilhada por todos os controles de formulário de texto. */
export const fieldBase = cn(
  "w-full rounded-lg border bg-surface text-sm text-ink",
  "placeholder:text-ink-mute/70",
  "transition-[border-color,box-shadow] duration-150 ease-out-quint",
  "focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-0",
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-mute",
);

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const descId = `${inputId}-desc`;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? descId : undefined}
          className={cn(
            fieldBase,
            "h-10 px-3",
            error
              ? "border-red-400 focus-visible:ring-red-300"
              : "border-line hover:border-graphite-200",
            className,
          )}
          {...props}
        />
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
  },
);
Input.displayName = "Input";
