import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import { Link } from "react-router-dom";

export interface Crumb {
  label: string;
  to?: string;
}

/**
 * Trilha de navegação (breadcrumbs). O último item é a página atual
 * (`aria-current="page"`) e não é um link. Discreta — orienta sem competir
 * com o título da página logo abaixo.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-ink-mute">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={`${item.label}-${i}`}>
              <li className="inline-flex items-center">
                {item.to && !last ? (
                  <Link
                    to={item.to}
                    className="rounded transition-colors hover:text-gold-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={last ? "font-medium text-ink-soft" : undefined}
                    aria-current={last ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!last && (
                <li aria-hidden className="inline-flex items-center text-line">
                  <ChevronRight className="h-3.5 w-3.5" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
