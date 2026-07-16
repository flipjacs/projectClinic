import { cn } from "@/utils/cn";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

/**
 * Avatar com iniciais do paciente. Tinta dourada discreta da marca — dá rosto a
 * cada linha e afasta a aparência de planilha, sem depender de foto.
 */
export function PatientAvatar({
  name,
  size = "md",
  className,
  muted,
}: {
  name: string;
  size?: keyof typeof sizes;
  className?: string;
  /** Paciente inativo → tom neutro em vez do dourado. */
  muted?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-inset",
        muted
          ? "bg-graphite-100 text-graphite-500 ring-graphite-200"
          : "bg-gold-100 text-gold-800 ring-gold-200",
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
