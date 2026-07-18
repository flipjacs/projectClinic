import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/utils/cn";

type CardVariant = "default" | "elevated" | "interactive";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: CardVariant;
}

const variants: Record<CardVariant, string> = {
  default: "shadow-card",
  elevated: "shadow-elevated",
  // Elevação com lift discreto: sobe 2px e a sombra acompanha.
  interactive:
    "shadow-card transition-[box-shadow,transform,border-color] duration-200 ease-out-quint hover:-translate-y-0.5 hover:shadow-lift hover:border-graphite-200 cursor-pointer",
};

export function Card({ className, children, variant = "default", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-line px-5 py-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...props }: CardProps) {
  return (
    <div className={cn("px-5 py-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: CardProps) {
  return (
    <h3
      className={cn(
        "text-sm font-semibold tracking-tight text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}
