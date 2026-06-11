import { formatMoney, shortDate, toNumber } from "./formatters";

export function sortRows(rows, sort) {
  if (!sort.key) {
    return rows;
  }

  const numeric = sort.key === "amount";
  const direction = sort.dir === "asc" ? 1 : -1;

  return [...rows].sort((left, right) => {
    const a = left[sort.key];
    const b = right[sort.key];

    if (numeric) {
      return (toNumber(a) - toNumber(b)) * direction;
    }

    return String(a ?? "").localeCompare(String(b ?? "")) * direction;
  });
}

export function rangeBounds(range) {
  if (range === "all") {
    return { from: "", to: "" };
  }

  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  const start = new Date(today);

  if (range === "7d") {
    start.setDate(start.getDate() - 6);
  } else if (range === "30d") {
    start.setDate(start.getDate() - 29);
  }

  return { from: start.toISOString().slice(0, 10), to };
}

export function presetFilters(preset) {
  const today = new Date();
  const todayText = dateInputValue(today);

  if (preset === "today") {
    return { from: todayText, to: todayText, range: "today" };
  }

  if (preset === "yesterday") {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const value = dateInputValue(yesterday);
    return { from: value, to: value, range: "all" };
  }

  if (preset === "7d") {
    return { ...rangeBounds("7d"), range: "7d" };
  }

  if (preset === "success") {
    return { status: "SUCCESS", range: "all" };
  }

  if (preset === "failed") {
    return { status: "FAILED", range: "all" };
  }

  return { range: "all" };
}

export function dateInputValue(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function rangeLabel(range) {
  return {
    today: "Today at a glance",
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    all: "All transactions"
  }[range];
}

export function peakDay(rows) {
  const peak = rows.reduce((winner, row) => (toNumber(row.amount) > toNumber(winner?.amount) ? row : winner), null);
  return peak ? `${shortDate(peak.date)} - ${formatMoney(peak.amount)}` : "No transactions";
}

export function smoothPath(points) {
  if (!points.length) {
    return "";
  }

  if (points.length === 1) {
    const point = points[0];
    return `M${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }

  return points.reduce((path, point, index) => {
    if (index === 0) {
      return `M${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    }

    const previous = points[index - 1];
    const controlDistance = (point.x - previous.x) * 0.5;
    const c1x = previous.x + controlDistance;
    const c2x = point.x - controlDistance;

    return `${path} C${c1x.toFixed(1)},${previous.y.toFixed(1)} ${c2x.toFixed(1)},${point.y.toFixed(1)} ${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }, "");
}

export function viewTitle(view) {
  return {
    dashboard: "Dashboard",
    reports: "Reports",
    transactions: "Transactions",
    airtime: "Airtime",
    merchants: "Merchants",
    email: "Email Reports"
  }[view];
}

export function viewHelp(view) {
  return {
    dashboard: "A quick view of what is happening right now.",
    reports: "Filter, compare, and download transaction reports.",
    transactions: "Review individual transaction records.",
    airtime: "Review airtime sales and their delivery status.",
    merchants: "Onboard resellers and manage wallets, commission, and API access.",
    email: "Choose who receives the automatic 2 AM daily report."
  }[view];
}
