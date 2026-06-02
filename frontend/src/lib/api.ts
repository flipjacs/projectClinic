import axios, { AxiosError } from "axios";

import { env } from "@/config/env";
import { clearSession, getToken } from "@/stores/auth-store";
import type { ApiError } from "@/types/api";

/** Instância central do Axios. */
export const api = axios.create({
  baseURL: env.apiUrl,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

// --- Request interceptor: injeta o Bearer token quando houver sessão. -------
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response interceptor: 401 → derruba a sessão. --------------------------
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token inválido/expirado: limpa a sessão. A navegação para /login é
      // tratada pelas rotas protegidas ao detectar ausência de token.
      clearSession();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Normaliza qualquer erro do Axios em { status, message } seguro para a UI,
 * sem vazar detalhes técnicos do backend.
 */
export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    return { status, message: messageForStatus(status) };
  }
  return { status: 0, message: "Não foi possível concluir a operação." };
}

function messageForStatus(status: number): string {
  switch (status) {
    case 0:
      return "Sem conexão com o servidor. Verifique sua internet.";
    case 400:
    case 422:
      return "Dados inválidos. Revise as informações e tente novamente.";
    case 401:
      return "Sessão expirada. Faça login novamente.";
    case 403:
      return "Você não tem permissão para esta ação.";
    case 404:
      return "Recurso não encontrado.";
    case 409:
      return "Conflito com o estado atual dos dados.";
    case 429:
      return "Muitas tentativas. Aguarde um instante e tente novamente.";
    default:
      return "Ocorreu um erro inesperado. Tente novamente em instantes.";
  }
}
