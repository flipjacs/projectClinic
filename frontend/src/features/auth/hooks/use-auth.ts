import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "@/stores/auth-store";
import type { User } from "@/types/api";
import { getMe, login as loginApi } from "../api/auth-api";
import type { LoginCredentials } from "../types/auth";

const ME_QUERY_KEY = ["auth", "me"] as const;

/**
 * Sessão de autenticação para a UI.
 *
 * O usuário logado é buscado UMA vez via /auth/me e cacheado pelo TanStack
 * Query (sem refetch em foco), evitando chamadas repetidas. O token vive no
 * Zustand (persistido).
 */
export function useAuth() {
  const token = useAuthStore((s) => s.token);
  const setToken = useAuthStore((s) => s.setToken);
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const meQuery = useQuery<User>({
    queryKey: ME_QUERY_KEY,
    queryFn: getMe,
    enabled: Boolean(token),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => loginApi(credentials),
    onSuccess: async (data) => {
      setToken(data.access_token);
      // Carrega o usuário imediatamente após autenticar.
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
  });

  function logout() {
    clear();
    queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
    queryClient.clear();
    navigate("/login", { replace: true });
  }

  return {
    token,
    isAuthenticated: Boolean(token),
    user: meQuery.data,
    isLoadingUser: meQuery.isLoading,
    isUserError: meQuery.isError,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.isError,
    logout,
  };
}
