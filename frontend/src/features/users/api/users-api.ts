import { api } from "@/lib/api";
import type { Paginated } from "@/types/api";
import type { CreateUserInput, UpdateUserInput, User } from "../types/user";

const MAX_PAGE_SIZE = 100; // teto imposto pelo backend (page_size ≤ 100)

async function getUsersPage(page: number): Promise<Paginated<User>> {
  const { data } = await api.get<Paginated<User>>("/users", {
    params: { page, page_size: MAX_PAGE_SIZE },
  });
  return data;
}

/**
 * Carrega TODOS os usuários. O endpoint só oferece paginação (sem busca/filtro
 * server-side), então trazemos o conjunto completo uma vez e a busca, filtros,
 * ordenação e paginação acontecem no cliente — instantâneos. Para uma clínica
 * isso é praticamente sempre uma única requisição; se houver mais de uma
 * página, as demais são buscadas em paralelo.
 */
export async function listAllUsers(): Promise<User[]> {
  const first = await getUsersPage(1);
  const totalPages = first.meta.total_pages;
  if (totalPages <= 1) return first.items;

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) => getUsersPage(i + 2)),
  );
  return [first.items, ...rest.map((p) => p.items)].flat();
}

export async function getUser(id: number): Promise<User> {
  const { data } = await api.get<User>(`/users/${id}`);
  return data;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const { data } = await api.post<User>("/users", input);
  return data;
}

export async function updateUser(id: number, input: UpdateUserInput): Promise<User> {
  const { data } = await api.patch<User>(`/users/${id}`, input);
  return data;
}

export async function activateUser(id: number): Promise<User> {
  const { data } = await api.patch<User>(`/users/${id}/activate`);
  return data;
}

export async function deactivateUser(id: number): Promise<User> {
  const { data } = await api.patch<User>(`/users/${id}/deactivate`);
  return data;
}
