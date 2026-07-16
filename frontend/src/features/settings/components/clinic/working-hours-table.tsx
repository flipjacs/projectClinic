import { CopyCheck } from "lucide-react";
import { forwardRef, memo, type InputHTMLAttributes } from "react";
import { useFormContext, useFormState, useWatch, Controller } from "react-hook-form";

import { IconButton } from "@/components/ui/icon-button";
import { Switch } from "@/components/ui/switch";
import { fieldBase } from "@/components/ui/input";
import { toast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";
import { WEEKDAYS, type ClinicSettingsFormValues } from "../../schemas/clinic-schema";

// ---------------------------------------------------------------------------
// Campo de hora compacto: rótulo visível só no mobile (no desktop a coluna do
// cabeçalho da tabela cumpre esse papel); leitores de tela sempre recebem o
// nome completo via aria-label.
// ---------------------------------------------------------------------------

interface TimeFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const TimeField = forwardRef<HTMLInputElement, TimeFieldProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="min-w-0">
      <span aria-hidden className="mb-1 block text-xs font-medium text-ink-mute sm:hidden">
        {label}
      </span>
      <input
        ref={ref}
        type="time"
        aria-label={label}
        aria-invalid={Boolean(error)}
        className={cn(
          fieldBase,
          "h-9 px-2.5 tabular-nums",
          error
            ? "border-red-400 focus-visible:ring-red-300"
            : "border-line hover:border-graphite-200",
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  ),
);
TimeField.displayName = "TimeField";

// ---------------------------------------------------------------------------
// Linha de um dia da semana
// ---------------------------------------------------------------------------

/** Colunas do desktop: dia | abre | fecha | intervalo (2) | copiar. */
const ROW_GRID =
  "grid grid-cols-2 gap-3 px-5 py-4 sm:grid-cols-[11rem_1fr_1fr_1fr_1fr_2.5rem] sm:items-start sm:gap-4";

const WorkingHoursRow = memo(function WorkingHoursRow({ index }: { index: number }) {
  const day = WEEKDAYS[index];
  const { register, control, getValues, setValue } =
    useFormContext<ClinicSettingsFormValues>();
  // Assinaturas locais: só esta linha re-renderiza ao ligar/desligar o dia.
  const enabled = useWatch({ control, name: `schedule.${index}.enabled` });
  const { errors } = useFormState({ control, name: `schedule.${index}` });
  const dayErrors = errors.schedule?.[index];

  function copyToOtherDays() {
    const source = getValues(`schedule.${index}`);
    WEEKDAYS.forEach(({ weekday }) => {
      if (weekday === index) return;
      const base = `schedule.${weekday}` as const;
      setValue(`${base}.opensAt`, source.opensAt, { shouldDirty: true });
      setValue(`${base}.closesAt`, source.closesAt, { shouldDirty: true });
      setValue(`${base}.breakStartsAt`, source.breakStartsAt, { shouldDirty: true });
      setValue(`${base}.breakEndsAt`, source.breakEndsAt, { shouldDirty: true });
    });
    toast.info(`Horário de ${day.label.toLowerCase()} aplicado aos demais dias.`);
  }

  return (
    <div className={ROW_GRID} role="group" aria-label={day.label}>
      <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:h-9">
        <Controller
          control={control}
          name={`schedule.${index}.enabled`}
          render={({ field }) => (
            <Switch
              label={day.label}
              checked={field.value}
              onChange={(event) => field.onChange(event.target.checked)}
              onBlur={field.onBlur}
            />
          )}
        />
        <span className="sm:hidden">
          <IconButton
            label={`Copiar horário de ${day.label} para os demais dias`}
            icon={CopyCheck}
            onClick={copyToOtherDays}
            disabled={!enabled}
          />
        </span>
      </div>

      <TimeField
        label="Abre"
        disabled={!enabled}
        error={enabled ? dayErrors?.opensAt?.message : undefined}
        {...register(`schedule.${index}.opensAt`)}
      />
      <TimeField
        label="Fecha"
        disabled={!enabled}
        error={enabled ? dayErrors?.closesAt?.message : undefined}
        {...register(`schedule.${index}.closesAt`)}
      />
      <TimeField
        label="Início do intervalo"
        disabled={!enabled}
        error={enabled ? dayErrors?.breakStartsAt?.message : undefined}
        {...register(`schedule.${index}.breakStartsAt`)}
      />
      <TimeField
        label="Fim do intervalo"
        disabled={!enabled}
        error={enabled ? dayErrors?.breakEndsAt?.message : undefined}
        {...register(`schedule.${index}.breakEndsAt`)}
      />

      <span className="hidden sm:block">
        <IconButton
          label={`Copiar horário de ${day.label} para os demais dias`}
          icon={CopyCheck}
          onClick={copyToOtherDays}
          disabled={!enabled}
        />
      </span>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Tabela completa
// ---------------------------------------------------------------------------

/**
 * Grade de funcionamento da semana. Cada dia liga/desliga com um switch;
 * horários e intervalo ficam na mesma linha, e qualquer dia pode ser copiado
 * para os demais com um clique.
 */
export function WorkingHoursTable() {
  return (
    <div className="divide-y divide-line">
      {/* Cabeçalho das colunas — o mobile usa rótulos por campo. */}
      <div
        aria-hidden
        className={cn(ROW_GRID, "hidden py-2.5 text-xs font-medium text-ink-mute sm:grid")}
      >
        <span>Dia</span>
        <span>Abre</span>
        <span>Fecha</span>
        <span className="col-span-2">Intervalo (início – fim)</span>
        <span />
      </div>
      {WEEKDAYS.map((day) => (
        <WorkingHoursRow key={day.weekday} index={day.weekday} />
      ))}
    </div>
  );
}
