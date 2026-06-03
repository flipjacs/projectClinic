import {
  Calendar,
  ClipboardList,
  LayoutDashboard,
  Package,
  PieChart,
  Settings,
  Stethoscope,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { ROLES, type Role } from "@/types/roles";

/** Seções da navegação para agrupamento visual na sidebar. */
export type NavSection = "main" | "admin";

/** Um item de navegação e os perfis que podem vê-lo/acessá-lo. */
export interface NavItemConfig {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
  roles: Role[];
  section: NavSection;
}

const ALL: Role[] = [ROLES.ADMIN, ROLES.DENTIST, ROLES.RECEPTIONIST];
const CLINICAL: Role[] = [ROLES.ADMIN, ROLES.DENTIST];

/**
 * Configuração estática do menu (filtrada por role em runtime — barato e sem
 * cálculos pesados). A ordem aqui é a ordem exibida na sidebar.
 *
 * Lembrete de segurança: esconder o item é apenas UX. A proteção REAL é o
 * RoleGuard nas rotas + as regras de RBAC do backend.
 */
export const NAV_ITEMS: NavItemConfig[] = [
  { key: "dashboard", label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ALL, section: "main" },
  { key: "patients", label: "Pacientes", path: "/patients", icon: Users, roles: ALL, section: "main" },
  { key: "appointments", label: "Agenda", path: "/appointments", icon: Calendar, roles: ALL, section: "main" },
  { key: "medical-records", label: "Prontuários", path: "/medical-records", icon: ClipboardList, roles: CLINICAL, section: "main" },
  { key: "procedures", label: "Procedimentos", path: "/procedures", icon: Stethoscope, roles: CLINICAL, section: "main" },
  { key: "finance", label: "Financeiro", path: "/finance", icon: Wallet, roles: [ROLES.ADMIN], section: "main" },
  { key: "inventory", label: "Estoque", path: "/inventory", icon: Package, roles: ALL, section: "main" },
  { key: "reports", label: "Relatórios", path: "/reports", icon: PieChart, roles: CLINICAL, section: "main" },
  { key: "users", label: "Usuários", path: "/users", icon: Users, roles: [ROLES.ADMIN], section: "admin" },
  { key: "settings", label: "Configurações", path: "/settings", icon: Settings, roles: [ROLES.ADMIN], section: "admin" },
];

/** Rótulos das seções da navegação. */
export const NAV_SECTION_LABELS: Record<NavSection, string> = {
  main: "Operação",
  admin: "Administração",
};

/** Itens visíveis para um determinado perfil. */
export function navItemsForRole(role: Role | undefined): NavItemConfig[] {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

/** Itens visíveis agrupados por seção, preservando a ordem de NAV_ITEMS. */
export function navSectionsForRole(
  role: Role | undefined,
): { section: NavSection; items: NavItemConfig[] }[] {
  const items = navItemsForRole(role);
  const sections: NavSection[] = ["main", "admin"];
  return sections
    .map((section) => ({ section, items: items.filter((i) => i.section === section) }))
    .filter((group) => group.items.length > 0);
}

/** Um perfil pode acessar uma rota? (usado por RoleGuard). */
export function canAccess(role: Role | undefined, allowed: Role[]): boolean {
  if (!role) return false;
  return allowed.includes(role);
}

export { ALL as ALL_ROLES, CLINICAL as CLINICAL_ROLES };
