import { ROLES, type Role } from "@/types/roles";
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

/** Tinta por cargo — dá ritmo visual à tabela e reforça a hierarquia. */
const roleTint: Record<Role, string> = {
  [ROLES.ADMIN]: "bg-gold-100 text-gold-800 ring-gold-200",
  [ROLES.DENTIST]: "bg-info-50 text-info-700 ring-info-200",
  [ROLES.RECEPTIONIST]: "bg-graphite-100 text-graphite-600 ring-graphite-200",
};

const mutedTint = "bg-graphite-100 text-graphite-400 ring-graphite-200";

/**
 * Avatar com iniciais do usuário. A cor segue o cargo (admin dourado, dentista
 * azul clínico, recepção neutro); usuários inativos ficam esmaecidos. Dá rosto
 * a cada linha sem depender de foto.
 */
export function UserAvatar({
  name,
  role,
  size = "md",
  inactive,
  className,
}: {
  name: string;
  role: Role;
  size?: keyof typeof sizes;
  inactive?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-inset",
        inactive ? mutedTint : roleTint[role],
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
