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

/** Um item de navegação e os perfis que podem vê-lo/acessá-lo. */
export interface NavItemConfig {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
  roles: Role[];
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
  { key: "dashboard", label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ALL },
  { key: "patients", label: "Pacientes", path: "/patients", icon: Users, roles: ALL },
  { key: "appointments", label: "Agenda", path: "/appointments", icon: Calendar, roles: ALL },
  { key: "medical-records", label: "Prontuários", path: "/medical-records", icon: ClipboardList, roles: CLINICAL },
  { key: "procedures", label: "Procedimentos", path: "/procedures", icon: Stethoscope, roles: CLINICAL },
  { key: "finance", label: "Financeiro", path: "/finance", icon: Wallet, roles: [ROLES.ADMIN] },
  { key: "inventory", label: "Estoque", path: "/inventory", icon: Package, roles: ALL },
  { key: "reports", label: "Relatórios", path: "/reports", icon: PieChart, roles: CLINICAL },
  { key: "users", label: "Usuários", path: "/users", icon: Users, roles: [ROLES.ADMIN] },
  { key: "settings", label: "Configurações", path: "/settings", icon: Settings, roles: [ROLES.ADMIN] },
];

/** Itens visíveis para um determinado perfil. */
export function navItemsForRole(role: Role | undefined): NavItemConfig[] {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

/** Um perfil pode acessar uma rota? (usado por RoleGuard). */
export function canAccess(role: Role | undefined, allowed: Role[]): boolean {
  if (!role) return false;
  return allowed.includes(role);
}

export { ALL as ALL_ROLES, CLINICAL as CLINICAL_ROLES };
