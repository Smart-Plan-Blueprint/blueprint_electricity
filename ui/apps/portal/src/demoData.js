const names = [
  "DUNDREGAN (PTY) LTD",
  "MOTAKASE HOLDINGS",
  "THUTO ENERGY SHOP",
  "BLUE VILLAGE SUPERMARKET",
  "KGOSI TRADING",
  "PALAPYE SERVICE STATION",
  "MAUN CASH STORE",
  "SEROWE MINI MART",
  "LOBATSE WHOLESALERS",
  "GABORONE TECH HUB"
];

const messages = {
  SUCCESS: "Transaction completed successfully",
  FAILED: "Provider rejected the vending request"
};

const demoTransactions = Array.from({ length: 100 }, (_, index) => {
  const number = index + 1;
  const status = number % 17 === 0 || number % 13 === 0 ? "FAILED" : "SUCCESS";
  const amount = [20, 40, 50, 75, 100, 150, 200, 250, 300, 500][index % 10];
  const date = new Date(Date.UTC(2026, 5, 8, 8, 45, 0));
  date.setHours(date.getHours() - index * 5);

  return {
    transaction_id: `demo-${String(number).padStart(4, "0")}-${String(900000 + index * 37)}`,
    created_at: date.toISOString().slice(0, 19).replace("T", " "),
    receipt_no: status === "SUCCESS" ? `SPB${String(700000 + index * 19)}` : "",
    meter_number: `14020${String(896826 + index * 113).padStart(6, "0")}`.slice(0, 11),
    customer_name: names[index % names.length],
    merchant_name: "Smart Plan Blueprint",
    amount: amount.toFixed(2),
    status,
    message: messages[status]
  };
});

export function createDemoReport(filters = {}) {
  return buildReport(demoTransactions, filters);
}

export function buildReport(transactions, filters = {}) {
  const page = Math.max(Number.parseInt(filters.page || "1", 10), 1);
  const perPage = Math.min(Math.max(Number.parseInt(filters.per_page || "10", 10), 1), 100);
  const filtered = filterTransactions(transactions, filters);
  const start = (page - 1) * perPage;
  const data = filtered.slice(start, start + perPage);

  return {
    results: "SUCCESS",
    data,
    meta: {
      current_page: page,
      last_page: Math.max(Math.ceil(filtered.length / perPage), 1),
      per_page: perPage,
      total: filtered.length
    },
    summary: summarize(filtered)
  };
}

function filterTransactions(rows, filters) {
  const status = String(filters.status || "").toUpperCase();
  const search = String(filters.search || "").trim().toLowerCase();
  const from = filters.from ? new Date(`${filters.from}T00:00:00`) : null;
  const to = filters.to ? new Date(`${filters.to}T23:59:59`) : null;

  return rows.filter((row) => {
    const created = new Date(row.created_at.replace(" ", "T"));
    const haystack = [
      row.transaction_id,
      row.meter_number,
      row.customer_name,
      row.merchant_name,
      row.receipt_no
    ].join(" ").toLowerCase();

    return (!status || row.status === status)
      && (!filters.transaction_id || row.transaction_id.includes(filters.transaction_id))
      && (!filters.meter_number || row.meter_number.includes(filters.meter_number))
      && (!search || haystack.includes(search))
      && (!from || created >= from)
      && (!to || created <= to);
  });
}

function summarize(rows) {
  const successRows = rows.filter((row) => row.status === "SUCCESS");
  const failedRows = rows.filter((row) => row.status === "FAILED");
  const totalAmount = sum(successRows);
  const failedAmount = sum(failedRows);
  const dailyTotals = Array.from(successRows.reduce((map, row) => {
    const date = row.created_at.slice(0, 10);
    const entry = map.get(date) || { amount: 0, count: 0 };
    entry.amount += Number(row.amount);
    entry.count += 1;
    map.set(date, entry);
    return map;
  }, new Map()).entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-7)
    .map(([date, { amount, count }]) => ({ date, amount, count }));
  const topMeters = Array.from(successRows.reduce((map, row) => {
    const current = map.get(row.meter_number) || { meter_number: row.meter_number, customer_name: row.customer_name, count: 0, amount: 0 };
    current.count += 1;
    current.amount += Number(row.amount);
    map.set(row.meter_number, current);
    return map;
  }, new Map()).values())
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 5);

  return {
    total_count: rows.length,
    success_count: successRows.length,
    failed_count: failedRows.length,
    total_amount: totalAmount,
    failed_amount: failedAmount,
    average_amount: successRows.length ? totalAmount / successRows.length : 0,
    receipt_count: successRows.length,
    unique_meters: new Set(rows.map((row) => row.meter_number)).size,
    success_rate: rows.length ? Math.round((successRows.length / rows.length) * 100) : 0,
    daily_totals: dailyTotals,
    top_meters: topMeters,
    trends: {
      total_count: 12,
      total_amount: 18,
      failed_count: -8,
      success_rate: 4
    },
    insights: {
      best_window: "Weekday mornings are carrying the strongest demo volume",
      risk_signal: `${failedRows.length} failed demo transactions need review`,
      action: "Use filters, pagination, and export exactly like live reporting"
    }
  };
}

function sum(rows) {
  return rows.reduce((total, row) => total + Number(row.amount), 0);
}
