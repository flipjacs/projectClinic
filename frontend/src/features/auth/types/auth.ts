export interface LoginCredentials {
  email: string;
  password: string;
}

/** Resposta de POST /auth/login. */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}
