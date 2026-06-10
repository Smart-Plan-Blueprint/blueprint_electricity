import { formatMoney, shortDate, toNumber } from "./formatters";

export function isSuccess(status) {
  const normalized = String(status || "").toUpperCase();
  return normalized === "SUCCESS" || normalized === "SUCCESSFUL";
}

export function normalizeStats(reports, rows) {
  const summary = reports?.summary;

  if (summary) {
    return {
      totalCount: summary.total_count,
      successCount: summary.success_count,
      failedCount: summary.failed_count,
      pendingCount: summary.pending_count,
      totalAmount: summary.total_amount,
      failedAmount: summary.failed_amount,
      averageAmount: summary.average_amount,
      receiptCount: summary.receipt_count,
      uniqueMeters: summary.unique_meters,
      successRate: summary.success_rate,
      dailyTotals: summary.daily_totals || [],
      topMeters: summary.top_meters || [],
      trends: summary.trends || null,
      insights: summary.insights || null
    };
  }

  return { ...calculateStats(rows), topMeters: [], trends: null, insights: null };
}

export function deltaProps(value, kind, invert = false) {
  if (value === null || value === undefined || value === 0) {
    return {};
  }

  const positive = value > 0;
  const good = invert ? !positive : positive;
  const sign = positive ? "+" : "";
  const text = kind === "points" ? `${sign}${value} pts` : `${sign}${value}%`;

  return { delta: `${text} vs prev`, deltaTone: good ? "up" : "down" };
}

export function plainInsights(stats) {
  const highestDay = stats.dailyTotals.reduce((winner, row) => toNumber(row.amount) > toNumber(winner?.amount) ? row : winner, null);
  const failedMessage = stats.failedCount
    ? `${stats.failedCount} transaction${stats.failedCount === 1 ? "" : "s"} failed and may need attention.`
    : "No failed transactions in this view.";
  const successMessage = stats.totalCount
    ? `${stats.successRate}% of transactions were successful.`
    : "No transactions are currently selected.";
  const moneyMessage = stats.totalAmount
    ? `${formatMoney(stats.totalAmount)} came from successful transactions.`
    : "No successful amount is showing in this view.";
  const peakMessage = highestDay
    ? `${shortDate(highestDay.date)} had the highest successful amount at ${formatMoney(highestDay.amount)}.`
    : "There is no daily trend yet.";

  return [
    { title: "Overall health", message: successMessage, tone: stats.successRate >= 90 ? "good" : stats.successRate >= 70 ? "watch" : "bad" },
    { title: "Money collected", message: moneyMessage, tone: "good" },
    { title: "Needs review", message: failedMessage, tone: stats.failedCount ? "bad" : "good" },
    { title: "Best day", message: peakMessage, tone: "watch" }
  ];
}

function calculateStats(rows) {
  const successRows = rows.filter((row) => isSuccess(row.status));
  const failedRows = rows.filter((row) => String(row.status || "").toUpperCase() === "FAILED");
  const pendingRows = rows.filter((row) => !isSuccess(row.status) && String(row.status || "").toUpperCase() !== "FAILED");
  const totalAmount = successRows.reduce((sum, row) => sum + toNumber(row.amount), 0);
  const failedAmount = failedRows.reduce((sum, row) => sum + toNumber(row.amount), 0);
  const dailyMap = new Map();

  successRows.forEach((row) => {
    const date = String(row.created_at || "Undated").slice(0, 10);
    dailyMap.set(date, (dailyMap.get(date) || 0) + toNumber(row.amount));
  });

  const dailyTotals = Array.from(dailyMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-7)
    .map(([date, amount]) => ({ date, amount }));

  return {
    totalCount: rows.length,
    successCount: successRows.length,
    failedCount: failedRows.length,
    pendingCount: pendingRows.length,
    totalAmount,
    failedAmount,
    averageAmount: successRows.length ? totalAmount / successRows.length : 0,
    receiptCount: rows.filter((row) => row.receipt_no).length,
    uniqueMeters: new Set(rows.map((row) => row.meter_number).filter(Boolean)).size,
    successRate: rows.length ? Math.round((successRows.length / rows.length) * 100) : 0,
    dailyTotals
  };
}
