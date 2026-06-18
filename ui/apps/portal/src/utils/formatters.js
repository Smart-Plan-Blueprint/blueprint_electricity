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

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(String(value).replace(" ", "T"));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const day = date.toLocaleDateString("en-BW", { day: "2-digit", month: "short", year: "numeric" });
  const time = date.toLocaleTimeString("en-BW", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day}, ${time}`;
}

export function shortDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value || "").slice(5);
  }

  return date.toLocaleDateString("en-BW", { month: "short", day: "numeric" });
}
