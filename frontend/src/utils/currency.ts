export type MoneyValue = string | number | null | undefined;

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function moneyToNumber(value: MoneyValue): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(value: MoneyValue): string {
  if (value === null || value === undefined || value === "") return "—";
  return currencyFormatter.format(moneyToNumber(value));
}

export function toMoneyPayload(value: string | number): string {
  const n = typeof value === "string" ? Number(value.replace(",", ".")) : value;
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}
