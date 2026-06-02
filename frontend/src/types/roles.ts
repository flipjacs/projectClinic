/** Perfis de usuário — espelham os valores do backend (lowercase). */
export const ROLES = {
  ADMIN: "admin",
  DENTIST: "dentist",
  RECEPTIONIST: "receptionist",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  dentist: "Dentista",
  receptionist: "Recepção",
};
