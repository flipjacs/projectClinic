import { HeadphonesIcon, ShieldCheck, Stethoscope, type LucideIcon } from "lucide-react";

import { ROLES, ROLE_LABELS, type Role } from "@/types/roles";

type BadgeTone = "gold" | "neutral" | "success" | "warning" | "danger" | "info";

/**
 * Metadados visuais de cada cargo — rótulo, ícone e tom do badge. Admin recebe
 * o dourado da marca (papel de maior autoridade); dentista, o azul clínico;
 * recepção, o neutro. O rótulo textual sempre acompanha o ícone, então o
 * significado nunca depende só da cor.
 */
export interface RoleMeta {
  label: string;
  icon: LucideIcon;
  tone: BadgeTone;
}

export const ROLE_META: Record<Role, RoleMeta> = {
  [ROLES.ADMIN]: { label: ROLE_LABELS.admin, icon: ShieldCheck, tone: "gold" },
  [ROLES.DENTIST]: { label: ROLE_LABELS.dentist, icon: Stethoscope, tone: "info" },
  [ROLES.RECEPTIONIST]: { label: ROLE_LABELS.receptionist, icon: HeadphonesIcon, tone: "neutral" },
};

/** Ordem canônica dos cargos (hierarquia: admin → dentista → recepção). */
export const ROLE_ORDER: Role[] = [ROLES.ADMIN, ROLES.DENTIST, ROLES.RECEPTIONIST];

/** Opções de cargo para <Select> (cadastro/edição). */
export const ROLE_OPTIONS = ROLE_ORDER.map((role) => ({
  value: role,
  label: ROLE_META[role].label,
}));
