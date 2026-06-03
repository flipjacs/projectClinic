import { z } from "zod";

const today = new Date();
today.setHours(0, 0, 0, 0);

/** Texto clínico opcional: limpo, com teto, aceitando vazio. */
const optionalClinicalText = z.string().trim().max(4000).optional().or(z.literal(""));

/**
 * Schema do formulário de prontuário. Espelha as regras do backend:
 * data não futura, queixa principal obrigatória, demais campos opcionais.
 */
export const medicalRecordSchema = z.object({
  visit_date: z
    .string()
    .min(1, "Informe a data do atendimento")
    .refine((v) => {
      const d = new Date(v);
      return !Number.isNaN(d.getTime()) && d <= today && d.getFullYear() >= 1900;
    }, "A data do atendimento não pode ser futura"),
  main_complaint: z
    .string()
    .trim()
    .min(1, "Descreva a queixa principal do paciente")
    .max(2000, "Texto muito longo"),
  diagnosis: optionalClinicalText,
  performed_procedure: optionalClinicalText,
  clinical_evolution: optionalClinicalText,
  observations: optionalClinicalText,
});

export type MedicalRecordFormValues = z.infer<typeof medicalRecordSchema>;
