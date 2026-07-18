import { Check, Plus } from "lucide-react";
import { useId } from "react";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils/cn";
import { COMMON_CONDITIONS } from "../constants/health-conditions";

interface HealthConditionSelectorProps {
  conditions: string[];
  otherEnabled: boolean;
  otherText: string;
  onConditionsChange: (next: string[]) => void;
  onOtherEnabledChange: (next: boolean) => void;
  onOtherTextChange: (next: string) => void;
  onClear: () => void;
  conditionsError?: string;
  otherError?: string;
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-1",
        selected
          ? "border-gold-400 bg-gold-50 font-medium text-gold-700"
          : "border-line bg-surface text-ink-soft hover:border-graphite-200",
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-gold-500 bg-gold-500 text-white" : "border-graphite-200 text-transparent",
        )}
        aria-hidden
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      {label}
    </button>
  );
}

export function HealthConditionSelector({
  conditions,
  otherEnabled,
  otherText,
  onConditionsChange,
  onOtherEnabledChange,
  onOtherTextChange,
  onClear,
  conditionsError,
  otherError,
}: HealthConditionSelectorProps) {
  const groupId = useId();
  const descId = `${groupId}-desc`;
  const hasSelection = conditions.length > 0 || otherEnabled;

  function toggle(condition: string) {
    if (conditions.includes(condition)) {
      onConditionsChange(conditions.filter((c) => c !== condition));
    } else {
      onConditionsChange([...conditions, condition]);
    }
  }

  return (
    <div className="rounded-xl border border-line bg-canvas/40 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-ink">Condições comuns</h4>
          <p id={descId} className="mt-0.5 text-xs text-ink-mute">
            Selecione uma ou mais condições relevantes para o atendimento.
          </p>
        </div>
        {hasSelection && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 text-xs font-medium text-ink-mute underline-offset-2 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 rounded"
          >
            Limpar seleção
          </button>
        )}
      </div>

      <div
        role="group"
        aria-label="Condições comuns"
        aria-describedby={descId}
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      >
        {COMMON_CONDITIONS.map((condition) => (
          <Chip
            key={condition}
            label={condition}
            selected={conditions.includes(condition)}
            onClick={() => toggle(condition)}
          />
        ))}
        <button
          type="button"
          onClick={() => onOtherEnabledChange(!otherEnabled)}
          aria-pressed={otherEnabled}
          className={cn(
            "flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-left text-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-1",
            otherEnabled
              ? "border-gold-400 bg-gold-50 font-medium text-gold-700"
              : "border-graphite-200 bg-surface text-ink-soft hover:border-graphite-300",
          )}
        >
          <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Outra condição
        </button>
      </div>

      {conditionsError && (
        <p className="mt-2 text-xs text-red-600">{conditionsError}</p>
      )}

      {otherEnabled && (
        <div className="mt-3">
          <Textarea
            label="Descreva a condição"
            rows={2}
            value={otherText}
            placeholder="Ex.: doença renal crônica"
            error={otherError}
            onChange={(e) => onOtherTextChange(e.target.value)}
          />
        </div>
      )}

      <p className="mt-3 text-xs text-ink-mute">
        Essas informações ajudam no planejamento do atendimento odontológico.
      </p>
    </div>
  );
}
