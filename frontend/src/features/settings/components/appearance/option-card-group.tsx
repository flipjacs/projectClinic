import { useId, type ReactNode } from "react";
import { Controller, useFormContext, type FieldPath } from "react-hook-form";

import { cn } from "@/utils/cn";
import type { AppearanceSettingsFormValues } from "../../schemas/appearance-schema";

export interface OptionCardItem<V extends string> {
  value: V;
  label: string;
  /** Nota curta abaixo do rótulo (ex.: "Padrão do dispositivo"). */
  hint?: string;
  /** Pré-visualização desenhada (mini-janela, mini-lista…). */
  preview?: ReactNode;
  /** Badge ao lado do rótulo (ex.: "Em desenvolvimento"). */
  badge?: ReactNode;
  /** Opção ainda indisponível — visível, porém não selecionável. */
  disabled?: boolean;
}

interface OptionCardGroupProps<V extends string> {
  name: FieldPath<AppearanceSettingsFormValues>;
  label: string;
  options: OptionCardItem<V>[];
  columns?: 2 | 3;
}

/**
 * Grupo de opções em cards (radiogroup acessível) conectado ao formulário.
 * Seleção pela seta/da barra de espaço via teclado; o card inteiro é o alvo
 * de clique; a opção ativa ganha anel dourado.
 */
export function OptionCardGroup<V extends string>({
  name,
  label,
  options,
  columns = 3,
}: OptionCardGroupProps<V>) {
  const { control } = useFormContext<AppearanceSettingsFormValues>();
  const labelId = useId();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div role="radiogroup" aria-labelledby={labelId}>
          <p id={labelId} className="sr-only">
            {label}
          </p>
          <div
            className={cn(
              "grid grid-cols-1 gap-3",
              columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2",
            )}
          >
            {options.map((option) => {
              const selected = field.value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-disabled={option.disabled || undefined}
                  onClick={() => {
                    if (!option.disabled) field.onChange(option.value);
                  }}
                  onBlur={field.onBlur}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-[border-color,box-shadow] duration-200 ease-out-quint",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2",
                    selected
                      ? "border-gold-400 shadow-gold-glow ring-1 ring-inset ring-gold-300"
                      : "border-line hover:border-graphite-200",
                    option.disabled && "cursor-not-allowed opacity-55 hover:border-line",
                  )}
                >
                  {option.preview && <div className="mb-2.5">{option.preview}</div>}
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        selected ? "text-ink" : "text-ink-soft",
                      )}
                    >
                      {option.label}
                    </span>
                    {option.badge}
                  </span>
                  {option.hint && (
                    <span className="mt-0.5 block text-xs text-ink-mute">{option.hint}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    />
  );
}
