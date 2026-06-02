import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Sessão de autenticação.
 *
 * Guardamos APENAS o token de acesso (persistido em localStorage para
 * sobreviver a refresh). O usuário logado NÃO é persistido aqui — ele é buscado
 * em /auth/me via TanStack Query, evitando manter dados sensíveis duplicados.
 */
interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      setToken: (token) => set({ token }),
      clear: () => set({ token: null }),
      isAuthenticated: () => Boolean(get().token),
    }),
    {
      name: "clinic.auth",
      // Persiste somente o token.
      partialize: (state) => ({ token: state.token }),
    },
  ),
);

/** Acesso ao token fora de componentes React (ex.: interceptors do Axios). */
export function getToken(): string | null {
  return useAuthStore.getState().token;
}

export function clearSession(): void {
  useAuthStore.getState().clear();
}
