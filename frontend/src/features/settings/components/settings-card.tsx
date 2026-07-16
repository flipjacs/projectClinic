import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import type { SettingsCategory } from "../types/settings";
import { SettingsBadge } from "./settings-badge";

/**
 * Card de categoria do hub de Configurações. Um card = uma página. O hover
 * levanta o card e desliza a seta — o mesmo lift discreto dos demais cartões
 * interativos do produto.
 */
export function SettingsCard({ category }: { category: SettingsCategory }) {
  const Icon = category.icon;

  return (
    <Link
      to={category.path}
      aria-label={`${category.label} — ${category.description}`}
      className={
        "group flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-card " +
        "transition-[box-shadow,transform,border-color] duration-200 ease-out-quint " +
        "hover:-translate-y-0.5 hover:border-graphite-200 hover:shadow-lift " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas " +
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-50 text-gold-600 ring-1 ring-inset ring-gold-100 transition-colors duration-200 group-hover:bg-gold-100"
        >
          <Icon className="h-5 w-5" />
        </span>
        <SettingsBadge status={category.status} />
      </div>

      <h3 className="mt-4 text-sm font-semibold tracking-tight text-ink">
        {category.label}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-ink-mute">{category.description}</p>

      <div className="mt-auto flex items-center justify-between pt-4 text-xs text-ink-mute">
        <span>
          {category.count} {category.count === 1 ? "ajuste" : "ajustes"}
        </span>
        <span
          aria-hidden
          className="inline-flex items-center gap-1 font-medium text-gold-700 opacity-0 transition-[opacity,transform] duration-200 ease-out-quint group-hover:opacity-100 group-focus-visible:opacity-100 motion-safe:-translate-x-1 motion-safe:group-hover:translate-x-0 motion-safe:group-focus-visible:translate-x-0"
        >
          Abrir
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
