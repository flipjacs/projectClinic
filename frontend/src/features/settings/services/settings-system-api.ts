import axios from "axios";

import { api } from "@/lib/api";
import { env } from "@/config/env";

/**
 * Client HTTP do painel Sistema. Os endpoints de saúde JÁ EXISTEM no backend
 * (fora do prefixo /api/v1): GET /health (liveness), GET /ready (readiness +
 * banco) e GET / (nome + versão). A latência é medida aqui, no cliente.
 */

/** Raiz do servidor (sem o prefixo /api/v1) para os endpoints de saúde. */
const ROOT_BASE_URL = env.apiUrl.replace(/\/api\/v1\/?$/, "");

export type ServiceState = "up" | "down";

export interface SystemStatus {
  api: { state: ServiceState; latencyMs: number | null };
  database: { state: ServiceState | null };
  backendVersion: string | null;
  checkedAt: string;
}

interface ReadyResponse {
  status: string;
  database?: string;
}

interface RootResponse {
  name?: string;
  version?: string;
  status?: string;
}

/**
 * Consulta os três endpoints de saúde em paralelo. Falhas parciais não
 * derrubam o painel — cada bloco reporta o próprio estado.
 */
export async function getSystemStatus(): Promise<SystemStatus> {
  const startedAt = performance.now();

  const [health, ready, root] = await Promise.allSettled([
    api.get("/health", { baseURL: ROOT_BASE_URL, timeout: 5000 }),
    api.get<ReadyResponse>("/ready", { baseURL: ROOT_BASE_URL, timeout: 5000 }),
    api.get<RootResponse>("/", { baseURL: ROOT_BASE_URL, timeout: 5000 }),
  ]);

  const apiUp = health.status === "fulfilled";
  const latencyMs = apiUp ? Math.round(performance.now() - startedAt) : null;

  let database: ServiceState | null = null;
  if (ready.status === "fulfilled") {
    database = ready.value.data.database === "up" ? "up" : "down";
  } else if (
    axios.isAxiosError(ready.reason) &&
    ready.reason.response?.status === 503
  ) {
    // O /ready responde 503 com o corpo indicando banco fora do ar.
    database = "down";
  }

  const backendVersion =
    root.status === "fulfilled" ? (root.value.data.version ?? null) : null;

  return {
    api: { state: apiUp ? "up" : "down", latencyMs },
    database: { state: database },
    backendVersion,
    checkedAt: new Date().toISOString(),
  };
}
