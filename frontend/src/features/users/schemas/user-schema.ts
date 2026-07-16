import { z } from "zod";

import { ROLES } from "@/types/roles";

/**
 * Validação dos formulários de usuário. Espelha exatamente as regras do backend
 * (`UserCreate`/`UserUpdate`) para dar feedback imediato sem depender do
 * round-trip: nome 2–120, e-mail válido, cargo dos três papéis, senha 8–128 com
 * letras + números e sem espaços nas pontas. A confirmação de senha é uma regra
 * de UX (o backend não a conhece) que evita erro de digitação.
 */

const roleEnum = z.enum([ROLES.ADMIN, ROLES.DENTIST, ROLES.RECEPTIONIST]);

const nameField = z
  .string()
  .trim()
  .min(2, "Informe ao menos 2 caracteres")
  .max(120, "Máximo de 120 caracteres");

const emailField = z
  .string()
  .trim()
  .min(1, "Informe o e-mail")
  .email("E-mail inválido");

/** Regra de força de senha idêntica à do backend. */
export const passwordField = z
  .string()
  .min(8, "Mínimo de 8 caracteres")
  .max(128, "Máximo de 128 caracteres")
  .refine((v) => v.trim() === v, "A senha não pode iniciar ou terminar com espaços")
  .refine((v) => /[a-zA-Z]/.test(v), "A senha deve conter ao menos uma letra")
  .refine((v) => /\d/.test(v), "A senha deve conter ao menos um número");

export const createUserSchema = z
  .object({
    name: nameField,
    email: emailField,
    role: roleEnum,
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirme a senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const editUserSchema = z
  .object({
    name: nameField,
    email: emailField,
    role: roleEnum,
    // Em branco = mantém a senha atual. Só valida força quando algo é digitado.
    password: z.union([z.literal(""), passwordField]),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirme a senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type EditUserFormValues = z.infer<typeof editUserSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const emptyCreateUserForm: CreateUserFormValues = {
  name: "",
  email: "",
  role: ROLES.RECEPTIONIST,
  password: "",
  confirmPassword: "",
};
