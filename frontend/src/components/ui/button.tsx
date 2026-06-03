import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variants: Record<Variant, string> = {
  // Ação principal — dourado sólido com leve elevação no hover.
  primary:
    "bg-gold-500 text-white shadow-sm hover:bg-gold-600 hover:shadow-gold-glow active:bg-gold-700 disabled:bg-gold-300 disabled:shadow-none",
  // Ação secundária — superfície clara com borda.
  secondary:
    "bg-white text-ink border border-line shadow-sm hover:bg-graphite-50 active:bg-graphite-100",
  // Contorno dourado — para CTAs informativos / alternativos.
  outline:
    "bg-transparent text-gold-700 border border-gold-300 hover:bg-gold-50 active:bg-gold-100",
  // Sutil — sem fundo até o hover.
  ghost: "bg-transparent text-ink-soft hover:bg-graphite-100 active:bg-graphite-200/60",
  // Destrutivo.
  danger:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 disabled:bg-red-300",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-[15px] gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", isLoading, disabled, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={cn(
          "inline-flex select-none items-center justify-center rounded-lg font-medium",
          "transition-[background-color,box-shadow,transform] duration-150 ease-out-quint",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2",
          "active:translate-y-px disabled:pointer-events-none disabled:opacity-70 disabled:active:translate-y-0",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
