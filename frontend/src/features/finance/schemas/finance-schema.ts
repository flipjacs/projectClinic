import { z } from "zod";

import type { PaymentMethod, PaymentStatus } from "../types/finance";

const moneyString = z
  .string()
  .trim()
  .min(1, "Informe o valor")
  .refine(
    (v) => Number(v.replace(",", ".")) > 0,
    "O valor deve ser maior que zero",
  )
  .refine(
    (v) => /^\d+([,.]\d{1,2})?$/.test(v),
    "Use no máximo 2 casas decimais",
  );

export const paymentSchema = z.object({
  patient_id: z.number().int().positive("Selecione o paciente"),
  patient_name: z.string().nullable().optional(),
  budget_id: z.number().int().positive().nullable(),
  amount: moneyString,
  payment_method: z.custom<PaymentMethod>(
    (v) => typeof v === "string" && v.length > 0,
    {
      message: "Selecione a forma de pagamento",
    },
  ),
  status: z.custom<PaymentStatus>((v) => typeof v === "string" && v.length > 0),
  paid_at_date: z.string().optional(),
  due_date: z.string().optional(),
  notes: z
    .string()
    .trim()
    .max(4000, "Texto muito longo")
    .optional()
    .or(z.literal("")),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

export const paymentEditSchema = z.object({
  payment_method: z.custom<PaymentMethod>((v) => typeof v === "string" && v.length > 0, {
    message: "Selecione a forma de pagamento",
  }),
  paid_at_date: z.string().optional(),
  due_date: z.string().optional(),
  notes: z.string().trim().max(4000, "Texto muito longo").optional().or(z.literal("")),
});

export type PaymentEditFormValues = z.infer<typeof paymentEditSchema>;

export const cancelReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, "Máximo de 500 caracteres")
    .optional()
    .or(z.literal("")),
});

export type CancelReasonValues = z.infer<typeof cancelReasonSchema>;
