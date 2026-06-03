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

export const budgetItemSchema = z.object({
  procedure_id: z.number().int().positive("Selecione o procedimento"),
  quantity: z
    .number()
    .int()
    .min(1, "Quantidade mínima 1")
    .max(1000, "Quantidade muito alta"),
  unit_price: moneyString.optional(),
});

export const budgetSchema = z.object({
  patient_id: z.number().int().positive("Selecione o paciente"),
  patient_name: z.string().nullable().optional(),
  dentist_id: z.number().int().positive("Selecione o profissional"),
  notes: z
    .string()
    .trim()
    .max(4000, "Texto muito longo")
    .optional()
    .or(z.literal("")),
  items: z.array(budgetItemSchema).min(1, "Adicione ao menos um procedimento"),
});

export type BudgetFormValues = z.infer<typeof budgetSchema>;

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

export const cancelReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, "Máximo de 500 caracteres")
    .optional()
    .or(z.literal("")),
});

export type CancelReasonValues = z.infer<typeof cancelReasonSchema>;
