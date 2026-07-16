import type { User } from "@/types/api";
import type { Role } from "@/types/roles";

/**
 * Tipos de domínio do módulo de Usuários. O formato de leitura (`User`) já vive
 * em `types/api.ts` (espelha o `UserRead` do backend: id, name, email, role,
 * is_active, created_at, updated_at — nunca o hash de senha). Aqui ficam apenas
 * os contratos de entrada e os tipos auxiliares da UI (filtros/ordenação).
 */
export type { User };

/** Payload de criação — espelha `UserCreate` (senha obrigatória). */
export interface CreateUserInput {
  name: string;
  email: string;
  role: Role;
  password: string;
}

/**
 * Payload de atualização — espelha `UserUpdate` (todos opcionais). Não inclui
 * `is_active`: o status muda somente pelos endpoints activate/deactivate.
 * `password` só vai quando o admin quiser redefini-la.
 */
export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: Role;
  password?: string;
}

/** Filtro de status na listagem (client-side). */
export type UserStatusFilter = "all" | "active" | "inactive";

/** Filtro por cargo na listagem (client-side). "all" = todos. */
export type UserRoleFilter = "all" | Role;

/** Chaves de ordenação suportadas pela tabela. */
export type UserSortKey = "name" | "created_at" | "role";
