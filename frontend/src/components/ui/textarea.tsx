import { forwardRef, useId, type TextareaHTMLAttributes } from "react";

import { cn } from "@/utils/cn";
import { fieldBase } from "./input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, rows = 4, ...props }, ref) => {
    const autoId = useId();
    const taId = id ?? autoId;
    const descId = `${taId}-desc`;
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
          aria-describedby={error || hint ? descId : undefined}
          className={cn(
            fieldBase,
            "resize-y px-3 py-2 leading-relaxed",
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
Textarea.displayName = "Textarea";
