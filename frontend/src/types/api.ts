import type { Role } from "./roles";

/** Usuário autenticado (resposta de GET /auth/me). */
export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Metadados de paginação retornados pelo backend. */
export interface PageMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

/** Envelope de paginação padrão do backend: { items, meta }. */
export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

/** Formato de erro normalizado que a camada de API expõe à UI. */
export interface ApiError {
  status: number;
  message: string;
}
