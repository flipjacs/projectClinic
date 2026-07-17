import { useFormContext, useWatch, type Control } from "react-hook-form";

import { FileText } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils/cn";
import type { ClinicSettingsFormValues } from "../../schemas/clinic-schema";
import { FeatureCard } from "../feature-card";

type NoteField = keyof ClinicSettingsFormValues["notes"];

/** Contador isolado: só ele re-renderiza a cada tecla, nunca o card. */
function CharCount({
  control,
  name,
  max,
}: {
  control: Control<ClinicSettingsFormValues>;
  name: NoteField;
  max: number;
}) {
  const value = useWatch({ control, name: `notes.${name}` }) ?? "";
  const remaining = max - value.length;
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute right-1 top-0.5 text-[11px] tabular-nums",
        remaining < 0 ? "font-medium text-red-600" : "text-ink-mute/80",
      )}
    >
      {value.length}/{max}
    </span>
  );
}

const NOTE_FIELDS: {
  name: NoteField;
  label: string;
  hint: string;
  max: number;
  rows: number;
}[] = [
  {
    name: "observations",
    label: "Observações",
    hint: "Anotações internas — visíveis apenas para a equipe.",
    max: 500,
    rows: 3,
  },
  {
    name: "defaultMessage",
    label: "Mensagem padrão",
    hint: "Texto sugerido em comunicações com pacientes.",
    max: 300,
    rows: 3,
  },
  {
    name: "pdfFooter",
    label: "Rodapé para PDFs",
    hint: "Aparece ao final de recibos e orçamentos gerados.",
    max: 200,
    rows: 2,
  },
  {
    name: "institutionalDescription",
    label: "Descrição institucional",
    hint: "Apresentação da clínica para integrações futuras (site, agendamento online).",
    max: 1000,
    rows: 4,
  },
];

/** Textos institucionais e mensagens reutilizadas pelo sistema. */
export function ClinicNotesCard() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ClinicSettingsFormValues>();

  return (
    <FeatureCard
      icon={FileText}
      title="Informações adicionais"
      description="Textos que o sistema reutiliza em documentos e comunicações."
    >
      <div className="grid grid-cols-1 gap-5">
        {NOTE_FIELDS.map((field) => (
          <div key={field.name} className="relative">
            <Textarea
              label={field.label}
              rows={field.rows}
              maxLength={field.max}
              hint={field.hint}
              error={errors.notes?.[field.name]?.message}
              {...register(`notes.${field.name}`)}
            />
            <CharCount control={control} name={field.name} max={field.max} />
          </div>
        ))}
      </div>
    </FeatureCard>
  );
}
