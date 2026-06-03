import { z } from "zod";

import { isValidCPF, onlyDigits, UFS } from "@/utils/masks";

const today = new Date();
today.setHours(0, 0, 0, 0);

export const patientSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome completo"),
  cpf: z
    .string()
    .min(1, "Informe o CPF")
    .refine((v) => isValidCPF(v), "CPF inválido"),
  birth_date: z
    .string()
    .min(1, "Informe a data de nascimento")
    .refine((v) => {
      const d = new Date(v);
      return !Number.isNaN(d.getTime()) && d <= today && d.getFullYear() >= 1900;
    }, "Data de nascimento inválida"),
  phone: z
    .string()
    .min(1, "Informe o telefone")
    .refine((v) => {
      const len = onlyDigits(v).length;
      return len === 10 || len === 11;
    }, "Telefone deve ter DDD + número"),
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("")),
  street: z.string().trim().min(1, "Informe a rua"),
  number: z.string().trim().min(1, "Informe o número"),
  neighborhood: z.string().trim().min(1, "Informe o bairro"),
  city: z.string().trim().min(1, "Informe a cidade"),
  state: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .refine((v) => (UFS as readonly string[]).includes(v), "UF inválida"),
  zip_code: z
    .string()
    .min(1, "Informe o CEP")
    .refine((v) => onlyDigits(v).length === 8, "CEP deve ter 8 dígitos"),
});

export type PatientFormValues = z.infer<typeof patientSchema>;

export const healthSchema = z
  .object({
    has_disease: z.boolean(),
    // Condições estruturadas — serializadas em `disease_description` no envio.
    disease_conditions: z.array(z.string()).default([]),
    disease_other_enabled: z.boolean().default(false),
    disease_other_text: z.string().trim().max(2000).default(""),
    has_allergy: z.boolean(),
    allergy_description: z.string().trim().max(2000).optional().or(z.literal("")),
    uses_medication: z.boolean(),
    medication_description: z.string().trim().max(2000).optional().or(z.literal("")),
    health_observations: z.string().trim().max(4000).optional().or(z.literal("")),
  })
  .superRefine((val, ctx) => {
    if (val.has_disease) {
      const hasOther = val.disease_other_enabled && val.disease_other_text.trim().length > 0;
      if (val.disease_conditions.length === 0 && !hasOther) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["disease_conditions"],
          message: "Selecione pelo menos uma condição ou preencha 'Outra condição'.",
        });
      }
      if (val.disease_other_enabled && !val.disease_other_text.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["disease_other_text"],
          message: "Informe qual é a outra condição.",
        });
      }
    }

    // Alergia e medicação: descrição obrigatória quando a flag está marcada
    // (espelha a regra de coerência do backend).
    const pairs: [boolean, string, "allergy_description" | "medication_description"][] = [
      [val.has_allergy, val.allergy_description ?? "", "allergy_description"],
      [val.uses_medication, val.medication_description ?? "", "medication_description"],
    ];
    for (const [flag, desc, field] of pairs) {
      if (flag && !desc.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: "Descreva quando a opção estiver marcada",
        });
      }
    }
  });

export type HealthFormValues = z.infer<typeof healthSchema>;
