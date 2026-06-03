import { ROLES, type Role } from "@/types/roles";
import type { User } from "@/types/api";

interface UserFactoryInput {
  id?: number;
  name?: string;
  email?: string;
  role?: Role;
  is_active?: boolean;
}

export function makeUser(input: UserFactoryInput = {}): User {
  const role = input.role ?? ROLES.ADMIN;
  return {
    id: input.id ?? 1,
    name: input.name ?? "Ana Teste",
    email: input.email ?? "ana.teste@clinic.local",
    role,
    is_active: input.is_active ?? true,
    created_at: "2026-01-10T12:00:00Z",
    updated_at: "2026-01-10T12:00:00Z",
  };
}

export const adminUser = makeUser({
  id: 1,
  name: "Admin Teste",
  email: "admin@clinic.local",
  role: ROLES.ADMIN,
});

export const dentistUser = makeUser({
  id: 2,
  name: "Dra. Teste",
  email: "dentist@clinic.local",
  role: ROLES.DENTIST,
});

export const receptionistUser = makeUser({
  id: 3,
  name: "Recepcao Teste",
  email: "reception@clinic.local",
  role: ROLES.RECEPTIONIST,
});
