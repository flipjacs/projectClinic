import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { maskCEP, maskCPF, maskPhone, UFS } from "@/utils/masks";
import { patientSchema, type PatientFormValues } from "../schemas/patient-schema";

interface PatientFormProps {
  defaultValues?: Partial<PatientFormValues>;
  onSubmit: (values: PatientFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const EMPTY: PatientFormValues = {
  name: "",
  cpf: "",
  birth_date: "",
  phone: "",
  email: "",
  street: "",
  number: "",
  neighborhood: "",
  city: "",
  state: "",
  zip_code: "",
};

export function PatientForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = "Salvar",
}: PatientFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: { ...EMPTY, ...defaultValues },
  });

  const ufOptions = UFS.map((uf) => ({ value: uf, label: uf }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Nome completo *" error={errors.name?.message} {...register("name")} />
          </div>

          <Controller
            control={control}
            name="cpf"
            render={({ field }) => (
              <Input
                label="CPF *"
                placeholder="000.000.000-00"
                inputMode="numeric"
                value={field.value}
                onChange={(e) => field.onChange(maskCPF(e.target.value))}
                error={errors.cpf?.message}
              />
            )}
          />

          <Input
            label="Data de nascimento *"
            type="date"
            error={errors.birth_date?.message}
            {...register("birth_date")}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <Input
                label="Telefone *"
                placeholder="(00) 00000-0000"
                inputMode="numeric"
                value={field.value}
                onChange={(e) => field.onChange(maskPhone(e.target.value))}
                error={errors.phone?.message}
              />
            )}
          />

          <Input
            label="E-mail"
            type="email"
            placeholder="opcional"
            error={errors.email?.message}
            {...register("email")}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <Input label="Rua *" error={errors.street?.message} {...register("street")} />
          </div>
          <div className="sm:col-span-2">
            <Input label="Número *" error={errors.number?.message} {...register("number")} />
          </div>
          <div className="sm:col-span-3">
            <Input
              label="Bairro *"
              error={errors.neighborhood?.message}
              {...register("neighborhood")}
            />
          </div>
          <div className="sm:col-span-3">
            <Controller
              control={control}
              name="zip_code"
              render={({ field }) => (
                <Input
                  label="CEP *"
                  placeholder="00000-000"
                  inputMode="numeric"
                  value={field.value}
                  onChange={(e) => field.onChange(maskCEP(e.target.value))}
                  error={errors.zip_code?.message}
                />
              )}
            />
          </div>
          <div className="sm:col-span-4">
            <Input label="Cidade *" error={errors.city?.message} {...register("city")} />
          </div>
          <div className="sm:col-span-2">
            <Select
              label="UF *"
              placeholder="UF"
              options={ufOptions}
              error={errors.state?.message}
              {...register("state")}
            />
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
