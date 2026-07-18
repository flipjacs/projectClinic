import axios from "axios";

import { api } from "@/lib/api";
import type {
  SecurityAuditInfo,
  SecuritySettingsFormValues,
} from "../schemas/security-schema";

/**
 * Client HTTP das Configurações de Segurança.
 *
 * Endpoints IMPLEMENTADOS (Fase 8): GET/PUT /settings/security persistem a
 * política de senha no MySQL (RBAC ADMIN, Audit Log). Sessões e 2FA têm a
 * arquitetura pronta e respondem 501 (nunca 404) até haver infraestrutura.
 */

const SECURITY_PATH = "/settings/security";
const AUDIT_PATH = "/settings/security/audit";
const LOGOUT_ALL_PATH = "/settings/security/logout-all";

/** DTO no formato do backend (snake_case, padrão dos outros módulos). */
export interface SecuritySettingsDto {
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_special_chars: boolean;
    expiration_days: number;
    allow_password_reuse: boolean;
  };
}

interface SecurityAuditDto {
  last_password_change: string | null;
  last_login: string | null;
  last_settings_change: string | null;
  recent_events_count: number | null;
}

// ---------------------------------------------------------------------------
// Mappers DTO ⇄ formulário
// ---------------------------------------------------------------------------

export function toSecurityFormValues(dto: SecuritySettingsDto): SecuritySettingsFormValues {
  const p = dto.password_policy;
  return {
    passwordPolicy: {
      minLength: p.min_length,
      requireUppercase: p.require_uppercase,
      requireLowercase: p.require_lowercase,
      requireNumbers: p.require_numbers,
      requireSpecialChars: p.require_special_chars,
      expirationDays: p.expiration_days,
      allowPasswordReuse: p.allow_password_reuse,
    },
  };
}

export function toSecurityPayload(values: SecuritySettingsFormValues): SecuritySettingsDto {
  const p = values.passwordPolicy;
  return {
    password_policy: {
      min_length: p.minLength,
      require_uppercase: p.requireUppercase,
      require_lowercase: p.requireLowercase,
      require_numbers: p.requireNumbers,
      require_special_chars: p.requireSpecialChars,
      expiration_days: p.expirationDays,
      allow_password_reuse: p.allowPasswordReuse,
    },
  };
}

// ---------------------------------------------------------------------------
// Chamadas HTTP
// ---------------------------------------------------------------------------

/** `null` = nada salvo ainda (ou endpoint ainda não implantado). */
export async function getSecuritySettings(): Promise<SecuritySettingsFormValues | null> {
  try {
    const { data } = await api.get<SecuritySettingsDto>(SECURITY_PATH);
    return toSecurityFormValues(data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

export async function updateSecuritySettings(
  values: SecuritySettingsFormValues,
): Promise<SecuritySettingsFormValues> {
  const { data } = await api.put<SecuritySettingsDto>(
    SECURITY_PATH,
    toSecurityPayload(values),
  );
  return toSecurityFormValues(data);
}

/** Trilha de auditoria resumida; `null` = backend ainda sem o recurso. */
export async function getSecurityAudit(): Promise<SecurityAuditInfo | null> {
  try {
    const { data } = await api.get<SecurityAuditDto>(AUDIT_PATH);
    return {
      lastPasswordChange: data.last_password_change,
      lastLogin: data.last_login,
      lastSettingsChange: data.last_settings_change,
      recentEventsCount: data.recent_events_count,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

/**
 * Encerra sessões no servidor. O encerramento de todas as sessões usa
 * /settings/security/logout-all; "others" reaproveita o mesmo endpoint. O
 * backend responde 501 enquanto a infraestrutura de sessões não existe — o
 * hook traduz isso numa mensagem honesta para o usuário.
 */
export async function terminateSessions(_scope: "others" | "all"): Promise<void> {
  await api.post(LOGOUT_ALL_PATH);
}

/** Exportação de dados pessoais (LGPD) — download assíncrono no futuro. */
export async function requestDataExport(): Promise<void> {
  await api.post("/settings/privacy/export");
}

/** Abertura de solicitação de remoção de dados (LGPD). */
export async function requestDataRemoval(): Promise<void> {
  await api.post("/settings/privacy/removal-request");
}
