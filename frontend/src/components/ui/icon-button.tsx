import { forwardRef, type ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/utils/cn";
import { Tooltip } from "./tooltip";

type IconButtonVariant = "ghost" | "secondary" | "danger";
type IconButtonSize = "sm" | "md";

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Nome acessível da ação — vira aria-label e tooltip nativo. */
  label: string;
  icon: LucideIcon;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

const variants: Record<IconButtonVariant, string> = {
  ghost: "text-ink-mute hover:bg-graphite-100 hover:text-ink active:bg-graphite-200/60",
  secondary:
    "border border-line bg-white text-ink-soft shadow-sm hover:bg-graphite-50 active:bg-graphite-100",
  danger: "text-danger-600 hover:bg-danger-50 active:bg-danger-100",
};

const sizes: Record<IconButtonSize, { button: string; icon: string }> = {
  sm: { button: "h-8 w-8 rounded-lg", icon: "h-4 w-4" },
  md: { button: "h-10 w-10 rounded-lg", icon: "h-5 w-5" },
};

/**
 * Botão de ícone do design system. Sempre com nome acessível (`label`) — o
 * ícone sozinho nunca carrega o significado.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, icon: Icon, variant = "ghost", size = "sm", className, ...props }, ref) => {
    return (
      <Tooltip label={label}>
        <button
          ref={ref}
          type="button"
          aria-label={label}
          className={cn(
            "inline-flex shrink-0 items-center justify-center",
            "transition-colors duration-150 ease-out-quint",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400",
            "disabled:pointer-events-none disabled:opacity-50",
            variants[variant],
            sizes[size].button,
            className,
          )}
          {...props}
        >
          <Icon className={sizes[size].icon} aria-hidden />
        </button>
      </Tooltip>
    );
  },
);
IconButton.displayName = "IconButton";
