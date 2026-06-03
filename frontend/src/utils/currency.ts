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

export function addMoney(a: MoneyValue, b: MoneyValue): number {
  return Math.round((moneyToNumber(a) + moneyToNumber(b)) * 100) / 100;
}

export function multiplyMoney(value: MoneyValue, quantity: number): number {
  return Math.round(moneyToNumber(value) * quantity * 100) / 100;
}
