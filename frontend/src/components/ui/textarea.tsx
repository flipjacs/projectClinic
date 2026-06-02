import { forwardRef, useId, type TextareaHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, rows = 4, ...props }, ref) => {
    const autoId = useId();
    const taId = id ?? autoId;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={taId} className="mb-1.5 block text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <textarea
          id={taId}
          ref={ref}
          rows={rows}
          aria-invalid={Boolean(error)}
          className={cn(
            "w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink",
            "placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-gold-400",
            error ? "border-red-400" : "border-gray-300",
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
