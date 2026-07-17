import { z } from "zod";

/**
 * Contrato do formulário Configurações → Segurança. O backend futuro valida
 * e aplica estas regras — aqui elas são editadas e pré-validadas para UX.
 */

export const passwordPolicySchema = z.object({
  minLength: z.coerce
    .number({ invalid_type_error: "Informe um número" })
    .int("Use um número inteiro")
    .min(6, "Mínimo de 6 caracteres")
    .max(64, "Máximo de 64 caracteres"),
  requireUppercase: z.boolean(),
  requireNumbers: z.boolean(),
  requireSpecialChars: z.boolean(),
  /** 0 = senhas nunca expiram. */
  expirationDays: z.coerce
    .number({ invalid_type_error: "Informe um número" })
    .int("Use um número inteiro")
    .min(0, "Use 0 para nunca expirar")
    .max(365, "Máximo de 365 dias"),
  allowPasswordReuse: z.boolean(),
});

export const securitySettingsSchema = z.object({
  passwordPolicy: passwordPolicySchema,
});

export type PasswordPolicy = z.infer<typeof passwordPolicySchema>;
export type SecuritySettingsFormValues = z.infer<typeof securitySettingsSchema>;

export function defaultSecuritySettings(): SecuritySettingsFormValues {
  return {
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      expirationDays: 0,
      allowPasswordReuse: false,
    },
  };
}

// ---------------------------------------------------------------------------
// Indicador da força da política (apresentação, não regra de negócio)
// ---------------------------------------------------------------------------

export type PolicyStrength = "basic" | "good" | "strong";

/** Classifica a política atual para o medidor visual do card. */
export function assessPolicyStrength(policy: PasswordPolicy): PolicyStrength {
  let score = 0;
  if (policy.minLength >= 8) score += 1;
  if (policy.minLength >= 12) score += 1;
  if (policy.requireUppercase) score += 1;
  if (policy.requireNumbers) score += 1;
  if (policy.requireSpecialChars) score += 1;
  if (!policy.allowPasswordReuse) score += 1;

  if (score >= 5) return "strong";
  if (score >= 3) return "good";
  return "basic";
}

// ---------------------------------------------------------------------------
// Auditoria (somente leitura — vinda do backend quando existir)
// ---------------------------------------------------------------------------

export interface SecurityAuditInfo {
  lastPasswordChange: string | null;
  lastLogin: string | null;
  lastSettingsChange: string | null;
  recentEventsCount: number | null;
}
