import { z } from "zod";

import { combineDateTimeToIso, DURATION_OPTIONS } from "../constants";

const durationValues = DURATION_OPTIONS.map((d) => d) as number[];

const dateField = z.string().min(1, "Informe a data");
const timeField = z.string().min(1, "Informe o horário");
const durationField = z
  .number({ invalid_type_error: "Selecione a duração" })
  .refine((v) => durationValues.includes(v), "Duração inválida");

/** Garante que o horário montado (data + hora) é no futuro. */
function refineFuture(
  val: { date: string; start_time: string },
  ctx: z.RefinementCtx,
) {
  const start = new Date(combineDateTimeToIso(val.date, val.start_time));
  if (Number.isNaN(start.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["date"], message: "Data/horário inválidos" });
    return;
  }
  if (start.getTime() <= Date.now()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["start_time"],
      message: "O horário deve ser no futuro",
    });
  }
}

export const appointmentSchema = z
  .object({
    patient_id: z.number().int().positive("Selecione o paciente"),
    dentist_id: z.number().int().positive("Selecione o profissional"),
    date: dateField,
    start_time: timeField,
    duration_min: durationField,
    reason: z.string().trim().max(200, "Máximo de 200 caracteres").optional().or(z.literal("")),
    notes: z.string().trim().max(4000, "Texto muito longo").optional().or(z.literal("")),
  })
  .superRefine(refineFuture);

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;

export const rescheduleSchema = z
  .object({
    date: dateField,
    start_time: timeField,
    duration_min: durationField,
    reason: z.string().trim().max(500, "Máximo de 500 caracteres").optional().or(z.literal("")),
  })
  .superRefine(refineFuture);

export type RescheduleFormValues = z.infer<typeof rescheduleSchema>;

export const cancelSchema = z.object({
  cancellation_reason: z
    .string()
    .trim()
    .max(500, "Máximo de 500 caracteres")
    .optional()
    .or(z.literal("")),
});

export type CancelFormValues = z.infer<typeof cancelSchema>;
