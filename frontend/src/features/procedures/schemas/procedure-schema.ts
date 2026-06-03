import { z } from "zod";

const moneyString = z
  .string()
  .trim()
  .min(1, "Informe o valor")
  .refine((v) => Number(v.replace(",", ".")) >= 0, "Valor inválido")
  .refine((v) => /^\d+([,.]\d{1,2})?$/.test(v), "Use no máximo 2 casas decimais");

export const procedureSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome com pelo menos 2 letras").max(150),
  description: z.string().trim().max(4000, "Texto muito longo").optional().or(z.literal("")),
  base_price: moneyString,
  estimated_duration_minutes: z
    .number({ invalid_type_error: "Informe a duração em minutos" })
    .int()
    .positive("A duração deve ser maior que zero")
    .max(1440, "Duração muito alta")
    .nullable()
    .optional(),
});

export type ProcedureFormValues = z.infer<typeof procedureSchema>;
