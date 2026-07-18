import { m, type Variants } from "framer-motion";
import { ShieldCheck, Stethoscope, UserMinus, Users, HeadphonesIcon, type LucideIcon } from "lucide-react";

import { AnimatedNumber } from "@/components/motion/animated-number";
import { Skeleton } from "@/components/ui/skeleton";
import { EASE } from "@/lib/motion";
import { cn } from "@/utils/cn";
import { ROLES } from "@/types/roles";
import type { UserRoleFilter, UserStatusFilter } from "../types/user";

const gridVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
};

export interface UserCounts {
  total: number;
  admins: number;
  dentists: number;
  receptionists: number;
  inactive: number;
}

interface UserSummaryCardsProps {
  counts: UserCounts;
  isLoading?: boolean;
  roleFilter: UserRoleFilter;
  statusFilter: UserStatusFilter;
  /** Aplica o recorte do cartão clicado (dois cliques no mesmo cartão limpa). */
  onSelect: (role: UserRoleFilter, status: UserStatusFilter) => void;
}

interface CardDef {
  key: string;
  label: string;
  value: number;
  icon: LucideIcon;
  role: UserRoleFilter;
  status: UserStatusFilter;
  highlight?: boolean;
}

/**
 * Resumo da base de usuários. Cada cartão é um filtro rápido: clicar em
 * "Administradores" recorta a tabela; clicar de novo limpa. O cartão ativo
 * ganha um anel dourado. Números animados dão vida sem exagero.
 */
export function UserSummaryCards({
  counts,
  isLoading,
  roleFilter,
  statusFilter,
  onSelect,
}: UserSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-2xl" />
        ))}
      </div>
    );
  }

  const cards: CardDef[] = [
    { key: "total", label: "Total", value: counts.total, icon: Users, role: "all", status: "all", highlight: true },
    { key: "admins", label: "Administradores", value: counts.admins, icon: ShieldCheck, role: ROLES.ADMIN, status: "all" },
    { key: "dentists", label: "Dentistas", value: counts.dentists, icon: Stethoscope, role: ROLES.DENTIST, status: "all" },
    { key: "receptionists", label: "Recepção", value: counts.receptionists, icon: HeadphonesIcon, role: ROLES.RECEPTIONIST, status: "all" },
    { key: "inactive", label: "Inativos", value: counts.inactive, icon: UserMinus, role: "all", status: "inactive" },
  ];

  function isActive(card: CardDef): boolean {
    if (card.key === "total") return roleFilter === "all" && statusFilter === "all";
    if (card.key === "inactive") return statusFilter === "inactive" && roleFilter === "all";
    return roleFilter === card.role && statusFilter === "all";
  }

  return (
    <m.div
      variants={gridVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
    >
      {cards.map((card) => {
        const active = isActive(card);
        const Icon = card.icon;
        return (
          <m.button
            key={card.key}
            variants={cardVariants}
            type="button"
            onClick={() => (active ? onSelect("all", "all") : onSelect(card.role, card.status))}
            aria-pressed={active}
            className={cn(
              "group relative overflow-hidden rounded-2xl border bg-surface p-4 text-left shadow-card",
              "transition-[box-shadow,border-color,transform] duration-150 ease-out-quint hover:shadow-soft",
              "active:scale-[0.985]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2",
              active ? "border-gold-300 ring-1 ring-gold-200" : "border-line",
            )}
          >
            {(card.highlight || active) && (
              <span className="absolute inset-x-0 top-0 h-0.5 bg-gold-400" aria-hidden />
            )}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-ink-mute">{card.label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">
                  <AnimatedNumber value={card.value} />
                </p>
              </div>
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                  active ? "bg-gold-100 text-gold-700" : "bg-graphite-100 text-graphite-500 group-hover:bg-graphite-200/70",
                )}
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
            </div>
          </m.button>
        );
      })}
    </m.div>
  );
}
