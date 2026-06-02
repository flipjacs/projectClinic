import { api } from "@/lib/api";
import type { User } from "@/types/api";
import type { LoginCredentials, TokenResponse } from "../types/auth";

/**
 * Login. O backend usa o fluxo OAuth2 Password (form-urlencoded) com o e-mail
 * no campo `username`.
 */
export async function login(credentials: LoginCredentials): Promise<TokenResponse> {
  const body = new URLSearchParams();
  body.set("username", credentials.email);
  body.set("password", credentials.password);

  const { data } = await api.post<TokenResponse>("/auth/login", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

/** Usuário autenticado. */
export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}
