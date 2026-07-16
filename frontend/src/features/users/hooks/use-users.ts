import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiErrorDetail, toApiError } from "@/lib/api";
import {
  activateUser,
  createUser,
  deactivateUser,
  getUser,
  listAllUsers,
  updateUser,
} from "../api/users-api";
import type { CreateUserInput, UpdateUserInput } from "../types/user";

export const userKeys = {
  all: ["users"] as const,
  list: () => ["users", "list"] as const,
  detail: (id: number) => ["users", "detail", id] as const,
};

/**
 * Lista completa de usuários (uma consulta cacheada). Busca/filtros/ordenação
 * são derivados dela na tela — sem novas requisições ao digitar.
 */
export function useUsersList() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: listAllUsers,
    staleTime: 60_000,
  });
}

/** Detalhe de um usuário (página de perfil). */
export function useUser(id: number) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getUser(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useUpdateUser(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => updateUser(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useToggleUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      active ? activateUser(id) : deactivateUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

/**
 * Mensagem segura para falhas do módulo de usuários. Prioriza o `detail` de
 * domínio do backend (ex.: "Não é possível inativar o último ADMIN ativo") e
 * cai para a genérica por status — nunca expõe erro técnico cru.
 */
export function userErrorMessage(error: unknown): string {
  return apiErrorDetail(error) ?? toApiError(error).message;
}
