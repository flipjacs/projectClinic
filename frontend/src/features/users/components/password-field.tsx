import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

import { fieldBase } from "@/components/ui/input";
import { cn } from "@/utils/cn";

interface PasswordFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

/**
 * Campo de senha com alternância mostrar/ocultar. Segue o mesmo visual do
 * <Input> do design system. A senha vive apenas no estado do formulário —
 * nunca é registrada em log nem persistida.
 */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const descId = `${inputId}-desc`;
    const [visible, setVisible] = useState(false);

    return (
      <div className="w-full">
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">
          {label}
        </label>
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type={visible ? "text" : "password"}
            aria-invalid={Boolean(error)}
            aria-describedby={error || hint ? descId : undefined}
            className={cn(
              fieldBase,
              "h-10 pl-3 pr-10",
              error
                ? "border-red-400 focus-visible:ring-red-300"
                : "border-line hover:border-graphite-200",
              className,
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-mute transition-colors hover:bg-graphite-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
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
PasswordField.displayName = "PasswordField";
