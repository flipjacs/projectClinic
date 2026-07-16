import { z } from "zod";

import { onlyDigits, UFS } from "@/utils/masks";

/**
 * Contrato do formulário Configurações → Clínica. Fonte única de verdade do
 * shape: os cards do formulário, os mappers da API e o backend futuro evoluem
 * contra este schema.
 */

// ---------------------------------------------------------------------------
// Horário de funcionamento
// ---------------------------------------------------------------------------

/** "HH:mm" em 24h — o mesmo formato dos <input type="time">. */
const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use o formato HH:mm");

/** Hora opcional: vazio ("") quando o dia não tem intervalo. */
const optionalTime = z.union([timeString, z.literal("")]);

export const dayScheduleSchema = z
  .object({
    /** 0 = segunda … 6 = domingo (ordem de exibição na tabela). */
    weekday: z.number().int().min(0).max(6),
    enabled: z.boolean(),
    opensAt: timeString,
    closesAt: timeString,
    breakStartsAt: optionalTime,
    breakEndsAt: optionalTime,
  })
  .superRefine((day, ctx) => {
    if (!day.enabled) return;
    if (day.opensAt >= day.closesAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["closesAt"],
        message: "Deve ser depois da abertura",
      });
    }
    const hasStart = day.breakStartsAt !== "";
    const hasEnd = day.breakEndsAt !== "";
    if (hasStart !== hasEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [hasStart ? "breakEndsAt" : "breakStartsAt"],
        message: "Preencha início e fim do intervalo",
      });
      return;
    }
    if (hasStart && hasEnd) {
      if (day.breakStartsAt >= day.breakEndsAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["breakEndsAt"],
          message: "Fim do intervalo deve ser depois do início",
        });
      }
      if (day.breakStartsAt < day.opensAt || day.breakEndsAt > day.closesAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["breakStartsAt"],
          message: "Intervalo deve estar dentro do expediente",
        });
      }
    }
  });

export type DaySchedule = z.infer<typeof dayScheduleSchema>;

// ---------------------------------------------------------------------------
// Identidade visual (logos)
// ---------------------------------------------------------------------------

/**
 * Valor de um logo no formulário. "remote" = já salvo no servidor (URL);
 * "local" = arquivo recém-escolhido aguardando upload no salvar.
 */
export type LogoValue =
  | { kind: "remote"; url: string }
  | { kind: "local"; file: File; previewUrl: string };

const logoValue = z.custom<LogoValue>(
  (v) =>
    typeof v === "object" &&
    v !== null &&
    "kind" in v &&
    ((v as LogoValue).kind === "remote" || (v as LogoValue).kind === "local"),
  { message: "Imagem inválida" },
);

// ---------------------------------------------------------------------------
// Campos de texto
// ---------------------------------------------------------------------------

const phoneDigits = (min: number, max: number, message: string) =>
  z.string().refine((v) => {
    const d = onlyDigits(v);
    return d.length >= min && d.length <= max;
  }, message);

/** Aceita "clinica.com.br" ou "https://clinica.com.br" — sem exigir protocolo. */
const WEBSITE_PATTERN = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i;

export const clinicSettingsSchema = z.object({
  general: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Informe o nome da clínica")
      .max(120, "Máximo de 120 caracteres"),
    tradeName: z.string().trim().max(120, "Máximo de 120 caracteres"),
    technicalDirector: z
      .string()
      .trim()
      .min(2, "Informe o responsável técnico")
      .max(120, "Máximo de 120 caracteres"),
    cro: z
      .string()
      .trim()
      .min(3, "Informe o CRO do responsável")
      .max(20, "Máximo de 20 caracteres"),
    phone: phoneDigits(10, 11, "Informe um telefone válido com DDD"),
    whatsapp: z.union([
      z.literal(""),
      phoneDigits(10, 11, "Informe um WhatsApp válido com DDD"),
    ]),
    email: z.string().trim().email("Informe um e-mail válido"),
    website: z.union([
      z.literal(""),
      z.string().trim().regex(WEBSITE_PATTERN, "Informe um endereço válido (ex.: clinica.com.br)"),
    ]),
  }),
  address: z.object({
    zipCode: z.string().refine((v) => onlyDigits(v).length === 8, "Informe um CEP válido"),
    street: z.string().trim().min(2, "Informe a rua").max(160),
    number: z.string().trim().min(1, "Informe o número").max(20),
    complement: z.string().trim().max(80),
    district: z.string().trim().min(2, "Informe o bairro").max(80),
    city: z.string().trim().min(2, "Informe a cidade").max(80),
    state: z.enum(UFS, { errorMap: () => ({ message: "Selecione o estado" }) }),
    country: z.string().trim().min(2, "Informe o país").max(60),
  }),
  schedule: z.array(dayScheduleSchema).length(7),
  branding: z.object({
    logo: logoValue.nullable(),
    logoSmall: logoValue.nullable(),
  }),
  notes: z.object({
    observations: z.string().max(500, "Máximo de 500 caracteres"),
    defaultMessage: z.string().max(300, "Máximo de 300 caracteres"),
    pdfFooter: z.string().max(200, "Máximo de 200 caracteres"),
    institutionalDescription: z.string().max(1000, "Máximo de 1000 caracteres"),
  }),
});

export type ClinicSettingsFormValues = z.infer<typeof clinicSettingsSchema>;

// ---------------------------------------------------------------------------
// Dias da semana e valores padrão
// ---------------------------------------------------------------------------

export const WEEKDAYS = [
  { weekday: 0, label: "Segunda-feira", short: "Seg" },
  { weekday: 1, label: "Terça-feira", short: "Ter" },
  { weekday: 2, label: "Quarta-feira", short: "Qua" },
  { weekday: 3, label: "Quinta-feira", short: "Qui" },
  { weekday: 4, label: "Sexta-feira", short: "Sex" },
  { weekday: 5, label: "Sábado", short: "Sáb" },
  { weekday: 6, label: "Domingo", short: "Dom" },
] as const;

/** Grade padrão: seg–sex 8h–18h com almoço; fim de semana fechado. */
function defaultSchedule(): DaySchedule[] {
  return WEEKDAYS.map(({ weekday }) => ({
    weekday,
    enabled: weekday <= 4,
    opensAt: "08:00",
    closesAt: "18:00",
    breakStartsAt: weekday <= 4 ? "12:00" : "",
    breakEndsAt: weekday <= 4 ? "13:00" : "",
  }));
}

export function defaultClinicSettings(): ClinicSettingsFormValues {
  return {
    general: {
      name: "",
      tradeName: "",
      technicalDirector: "",
      cro: "",
      phone: "",
      whatsapp: "",
      email: "",
      website: "",
    },
    address: {
      zipCode: "",
      street: "",
      number: "",
      complement: "",
      district: "",
      city: "",
      state: "" as ClinicSettingsFormValues["address"]["state"],
      country: "Brasil",
    },
    schedule: defaultSchedule(),
    branding: { logo: null, logoSmall: null },
    notes: {
      observations: "",
      defaultMessage: "",
      pdfFooter: "",
      institutionalDescription: "",
    },
  };
}
