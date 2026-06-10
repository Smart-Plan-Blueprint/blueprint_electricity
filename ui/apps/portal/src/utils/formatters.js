export function toNumber(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

export function formatMoney(value) {
  const amount = toNumber(value);

  return new Intl.NumberFormat("en-BW", {
    style: "currency",
    currency: "BWP",
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-BW", { maximumFractionDigits: 2 }).format(toNumber(value));
}

export function formatCompactMoney(value) {
  return new Intl.NumberFormat("en-BW", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(toNumber(value));
}

export function shortDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value || "").slice(5);
  }

  return date.toLocaleDateString("en-BW", { month: "short", day: "numeric" });
}
