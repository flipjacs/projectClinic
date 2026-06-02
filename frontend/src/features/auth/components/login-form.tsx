import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema, type LoginFormValues } from "../schemas/login-schema";
import { useAuth } from "../hooks/use-auth";

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      await login(values);
      navigate("/dashboard", { replace: true });
    } catch {
      // Mensagem amigável e genérica — nunca expõe detalhes técnicos do backend.
      setFormError("E-mail ou senha incorretos. Verifique e tente novamente.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {formError}
        </div>
      )}

      <Input
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="voce@clinica.com.br"
        error={errors.email?.message}
        {...register("email")}
      />

      <Input
        label="Senha"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register("password")}
      />

      <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
        Entrar
      </Button>
    </form>
  );
}
