import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { formatMoney, toNumber } from "../../utils/formatters";

const OUTLET_ID = "3928-01";
const OUTLET_NAME = "SCBBB";
const ELECTRICITY_USER = "Smart Plan Blueprint-01";
const ELECTRICITY_PROVIDER = "Botswana Power Corporation";

const REPORT_TABS = [
  { key: "date", label: "Sales by date" },
  { key: "outlet", label: "Sales by outlet" },
  { key: "user", label: "Sales by user" },
  { key: "provider", label: "Sales by provider" },
  { key: "itemised", label: "Itemised sales" },
  { key: "statement", label: "Merchant statement" }
];

export default function ReportTabsPreview({ rows = [], compact = false, onOpenReports }) {
  const [active, setActive] = useState("date");
  const salesRows = useMemo(() => rows.map(toSaleRow).filter((row) => isSuccessful(row.status)), [rows]);
  const totalSales = salesRows.reduce((total, row) => total + row.amount, 0);

  const content = useMemo(() => buildTabContent(active, salesRows, totalSales, compact), [active, salesRows, totalSales, compact]);

  return (
    <div className="report-tabs-preview">
      <div className="report-tab-list" role="tablist" aria-label="Report tabs">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            className={active === tab.key ? "active" : ""}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="report-tab-panel" role="tabpanel">
        {content}
      </div>

      {onOpenReports ? (
        <button type="button" className="report-open-link" onClick={onOpenReports}>
          Open full report
          <ArrowRight size={15} />
        </button>
      ) : null}
    </div>
  );
}

function buildTabContent(active, salesRows, totalSales, compact) {
  const cap = (grouped) => compact ? grouped.slice(-5) : grouped;

  if (active === "date") {
    return (
      <ReportTable
        columns={["Date", "Amount"]}
        rows={[
          ...cap(groupRows(salesRows, ["date"])).map((row) => [row.date, formatMoney(row.amount)]),
          ["Sales total", formatMoney(totalSales)]
        ]}
      />
    );
  }

  if (active === "outlet") {
    return (
      <ReportTable
        columns={["Outlet Id", "Outlet Name", "Amount"]}
        rows={[
          ...cap(groupRows(salesRows, ["outletId", "outletName"])).map((row) => [row.outletId, row.outletName, formatMoney(row.amount)]),
          ["Sales total", "", formatMoney(totalSales)]
        ]}
      />
    );
  }

  if (active === "user") {
    return (
      <ReportTable
        columns={["User Id", "Name", "Amount"]}
        rows={[
          ...cap(groupRows(salesRows, ["userId", "userName"])).map((row) => [row.userId, row.userName, formatMoney(row.amount)]),
          ["Sales total", "", formatMoney(totalSales)]
        ]}
      />
    );
  }

  if (active === "provider") {
    return (
      <ReportTable
        columns={["Sale Type", "Provider", "Amount"]}
        rows={[
          ...cap(groupRows(salesRows, ["saleType", "provider"])).map((row) => [row.saleType, row.provider, formatMoney(row.amount)]),
          ["Sales total", "", formatMoney(totalSales)]
        ]}
      />
    );
  }

  if (active === "itemised") {
    const rows = [...salesRows]
      .sort((left, right) => String(right.dateTime).localeCompare(String(left.dateTime)))
      .slice(0, compact ? 5 : 10)
      .map((row) => [row.dateTime || "N/A", row.saleType, row.provider, row.reference || "N/A", formatMoney(row.amount)]);

    return <ReportTable columns={["Date Time", "Sale Type", "Provider", "Reference", "Amount"]} rows={rows} />;
  }

  const commissions = groupRows(salesRows, ["saleType", "provider"]).map((row) => {
    const rate = commissionRate(row.saleType);
    return [
      `${row.saleType} - ${row.provider}`,
      formatMoney(row.amount),
      formatRate(rate),
      formatMoney(row.amount * rate)
    ];
  });
  const commissionTotal = groupRows(salesRows, ["saleType", "provider"]).reduce((total, row) => total + row.amount * commissionRate(row.saleType), 0);

  return (
    <div className="merchant-statement-preview">
      <dl className="statement-summary">
        <div><dt>Total sales</dt><dd>{formatMoney(totalSales)}</dd></div>
        <div><dt>Outlet</dt><dd>{OUTLET_ID} / {OUTLET_NAME}</dd></div>
        <div><dt>Commission</dt><dd>{formatMoney(commissionTotal)}</dd></div>
      </dl>
      <ReportTable
        columns={["Product Type", "Sales", "Rate", "Commission"]}
        rows={[
          ...commissions,
          ["Total commission", formatMoney(totalSales), "", formatMoney(commissionTotal)]
        ]}
      />
    </div>
  );
}

function ReportTable({ columns, rows }) {
  if (!rows.length) {
    return <div className="empty-state">No successful sales in the loaded rows.</div>;
  }

  return (
    <div className="report-mini-table-wrap">
      <table className="report-mini-table">
        <thead>
          <tr>
            {columns.map((column) => <th key={column}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.join("-")}-${index}`}>
              {row.map((value, cellIndex) => <td key={`${cellIndex}-${value}`}>{value}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function toSaleRow(row) {
  const isAirtime = row._type === "airtime";
  const saleType = isAirtime ? "Airtime" : "Electricity";

  return {
    dateTime: row.created_at || "",
    date: datePart(row.created_at),
    outletId: OUTLET_ID,
    outletName: OUTLET_NAME,
    userId: isAirtime ? (row.merchant_name || row.user || ELECTRICITY_USER) : ELECTRICITY_USER,
    userName: "Not Set",
    saleType,
    provider: isAirtime ? (row._detail || row.product_name || "Airtime") : ELECTRICITY_PROVIDER,
    reference: row._reference || row.meter_number || row.phonenumber || "",
    amount: toNumber(row.amount),
    status: row.status
  };
}

function groupRows(rows, keys) {
  const groups = rows.reduce((current, row) => {
    const key = keys.map((name) => row[name] || "").join("|");
    const existing = current.get(key) || keys.reduce((item, name) => ({ ...item, [name]: row[name] || "" }), { amount: 0 });
    existing.amount += row.amount;
    current.set(key, existing);
    return current;
  }, new Map());

  return Array.from(groups.values()).sort((left, right) => {
    const leftKey = keys.map((key) => left[key]).join("|");
    const rightKey = keys.map((key) => right[key]).join("|");
    return leftKey.localeCompare(rightKey);
  });
}

function datePart(value) {
  const date = String(value || "").slice(0, 10);
  return date || "Undated";
}

function isSuccessful(status) {
  const value = String(status || "").toUpperCase();
  return value === "SUCCESS" || value === "SUCCESSFUL";
}

function commissionRate(saleType) {
  const value = String(saleType || "").toLowerCase();
  if (value === "airtime") return 0.09;
  if (value === "electricity") return 0.035;
  return 0;
}

function formatRate(rate) {
  if (!rate) return "0%";
  return `${Number((rate * 100).toFixed(2))}%`;
}
