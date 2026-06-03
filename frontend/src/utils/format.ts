/** Formatações pt-BR reutilizáveis (moeda, data, hora). */

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Constrói uma Date local a partir de "YYYY-MM-DD" sem deslocamento de fuso. */
function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

/** Data sem hora (ex.: visit_date) — "dd/mm/aaaa", segura quanto a fuso. */
export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return "—";
  const d = parseDateOnly(value);
  return d ? d.toLocaleDateString("pt-BR") : "—";
}

/** Data por extenso (ex.: "1 de maio de 2024") para títulos de leitura. */
export function formatDateLong(value: string | null | undefined): string {
  if (!value) return "—";
  const d = parseDateOnly(value);
  return d
    ? d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
    : "—";
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
