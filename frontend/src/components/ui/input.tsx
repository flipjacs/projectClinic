import { forwardRef, useId, type InputHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
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
          className={cn(
            "h-10 w-full rounded-lg border bg-white px-3 text-sm text-ink",
            "placeholder:text-gray-400",
            "focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-0",
            error ? "border-red-400" : "border-gray-300",
            className,
          )}
          {...props}
        />
        {error ? (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-xs text-gray-500">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";
