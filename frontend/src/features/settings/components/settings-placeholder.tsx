import { Check, type LucideIcon } from "lucide-react";

import type { PlannedSetting } from "../types/settings";

/**
 * Estado "em desenvolvimento" das categorias futuras. Em vez de uma página em
 * branco, mostra concretamente o que a seção vai oferecer — com a mesma
 * linguagem visual dos estados vazios do produto.
 */
export function SettingsPlaceholder({
  icon: Icon,
  title = "Esta seção está em desenvolvimento",
  description,
  planned,
}: {
  icon: LucideIcon;
  title?: string;
  description?: string;
  planned: PlannedSetting[];
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white/40 px-6 py-10 sm:px-10">
      <div className="flex flex-col items-center text-center">
        {/* Medalhão em camadas — mesmo motivo visual do EmptyState do app. */}
        <div className="relative mb-5 flex h-16 w-16 items-center justify-center" aria-hidden>
          <span className="absolute inset-0 rounded-full bg-gold-50" />
          <span className="absolute inset-[6px] rounded-full bg-gold-100/70" />
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-card ring-1 ring-gold-200">
            <Icon className="h-5 w-5 text-gold-600" />
          </span>
        </div>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {description && <p className="mt-1 max-w-md text-sm text-ink-mute">{description}</p>}
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        <h3 className="text-xs font-medium uppercase tracking-wide text-ink-mute">
          O que chega nesta seção
        </h3>
        <ul className="mt-3 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {planned.map((item) => (
            <li key={item.title} className="flex items-start gap-2.5">
              <span
                aria-hidden
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-50 ring-1 ring-inset ring-success-200"
              >
                <Check className="h-3 w-3 text-success-600" strokeWidth={3} />
              </span>
              <span className="min-w-0 text-sm">
                <span className="font-medium text-ink">{item.title}</span>
                <span className="block text-ink-mute">{item.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
