import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  FileText,
  ListTree,
  Store,
  UserRound,
  Zap
} from "lucide-react";
import { formatMoney, toNumber } from "../../utils/formatters";

const OUTLET_ID = "3928-01";
const OUTLET_NAME = "SCBBB";
const ELECTRICITY_USER = "Smart Plan Blueprint-01";
const ELECTRICITY_PROVIDER = "Botswana Power Corporation";

const REPORT_TABS = [
  {
    key: "date",
    label: "Sales by date",
    icon: CalendarDays,
    tone: "blue"
  },
  {
    key: "outlet",
    label: "Sales by outlet",
    icon: Store,
    tone: "green"
  },
  {
    key: "user",
    label: "Sales by user",
    icon: UserRound,
    tone: "purple"
  },
  {
    key: "provider",
    label: "Sales by provider",
    icon: Zap,
    tone: "yellow"
  },
  {
    key: "itemised",
    label: "Itemised sales",
    icon: ListTree,
    tone: "cyan"
  },
  {
    key: "statement",
    label: "Merchant statement",
    icon: FileText,
    tone: "pink"
  }
];

export default function ReportTabsPreview({
  rows = [],
  compact = false,
  onOpenReports
}) {
  const [active, setActive] = useState("date");

  const salesRows = useMemo(() => {
    return rows.map(toSaleRow).filter((row) => isSuccessful(row.status));
  }, [rows]);

  const totalSales = useMemo(() => {
    return salesRows.reduce((total, row) => total + row.amount, 0);
  }, [salesRows]);

  const activeTab = REPORT_TABS.find((tab) => tab.key === active) || REPORT_TABS[0];

  const content = useMemo(() => {
    return buildTabContent(active, salesRows, totalSales, compact);
  }, [active, salesRows, totalSales, compact]);

  function handleTabKeyDown(event, currentIndex) {
    const lastIndex = REPORT_TABS.length - 1;
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") {
      nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
    }

    if (event.key === "ArrowLeft") {
      nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
    }

    if (event.key === "Home") {
      nextIndex = 0;
    }

    if (event.key === "End") {
      nextIndex = lastIndex;
    }

    if (nextIndex !== currentIndex) {
      event.preventDefault();
      setActive(REPORT_TABS[nextIndex].key);
    }
  }

  return (
    <div className="report-tabs-preview">
      <div className="report-tab-shell">
        <div className="report-tab-list" role="tablist" aria-label="Report tabs">
          {REPORT_TABS.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = active === tab.key;
            const tabId = `report-tab-${tab.key}`;
            const panelId = `report-panel-${tab.key}`;

            return (
              <button
                key={tab.key}
                id={tabId}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={panelId}
                tabIndex={isActive ? 0 : -1}
                className={`report-tab-button ${isActive ? "active" : ""}`}
                onClick={() => setActive(tab.key)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                <span className={`report-tab-icon tone-${tab.tone}`} aria-hidden="true">
                  <Icon size={15} strokeWidth={2.2} />
                </span>

                <span className="report-tab-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        id={`report-panel-${activeTab.key}`}
        className="report-tab-panel"
        role="tabpanel"
        aria-labelledby={`report-tab-${activeTab.key}`}
      >
        {content}
      </div>

      {onOpenReports ? (
        <button type="button" className="report-open-link" onClick={onOpenReports}>
          Open full report
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

function buildTabContent(active, salesRows, totalSales, compact) {
  const cap = (grouped) => (compact ? grouped.slice(-5) : grouped);

  if (active === "date") {
    const groupedRows = cap(groupRows(salesRows, ["date"]));

    return (
      <ReportTable
        columns={["Date", "Amount"]}
        rows={[
          ...groupedRows.map((row) => [
            row.date,
            formatMoney(row.amount)
          ]),
          ["Sales total", formatMoney(totalSales)]
        ]}
      />
    );
  }

  if (active === "outlet") {
    const groupedRows = cap(groupRows(salesRows, ["outletId", "outletName"]));

    return (
      <ReportTable
        columns={["Outlet Id", "Outlet Name", "Amount"]}
        rows={[
          ...groupedRows.map((row) => [
            row.outletId,
            row.outletName,
            formatMoney(row.amount)
          ]),
          ["Sales total", "", formatMoney(totalSales)]
        ]}
      />
    );
  }

  if (active === "user") {
    const groupedRows = cap(groupRows(salesRows, ["userId", "userName"]));

    return (
      <ReportTable
        columns={["User Id", "Name", "Amount"]}
        rows={[
          ...groupedRows.map((row) => [
            row.userId,
            row.userName,
            formatMoney(row.amount)
          ]),
          ["Sales total", "", formatMoney(totalSales)]
        ]}
      />
    );
  }

  if (active === "provider") {
    const groupedRows = cap(groupRows(salesRows, ["saleType", "provider"]));

    return (
      <ReportTable
        columns={["Sale Type", "Provider", "Amount"]}
        rows={[
          ...groupedRows.map((row) => [
            row.saleType,
            row.provider,
            formatMoney(row.amount)
          ]),
          ["Sales total", "", formatMoney(totalSales)]
        ]}
      />
    );
  }

  if (active === "itemised") {
    const itemisedRows = [...salesRows]
      .sort((left, right) =>
        String(right.dateTime).localeCompare(String(left.dateTime))
      )
      .slice(0, compact ? 5 : 10)
      .map((row) => [
        row.dateTime || "N/A",
        row.saleType,
        row.provider,
        row.reference || "N/A",
        formatMoney(row.amount)
      ]);

    return (
      <ReportTable
        columns={["Date Time", "Sale Type", "Provider", "Reference", "Amount"]}
        rows={itemisedRows}
      />
    );
  }

  const statementRows = groupRows(salesRows, ["saleType", "provider"]);

  const commissions = statementRows.map((row) => {
    const rate = commissionRate(row.saleType);

    return [
      `${row.saleType} - ${row.provider}`,
      formatMoney(row.amount),
      formatRate(rate),
      formatMoney(row.amount * rate)
    ];
  });

  const commissionTotal = statementRows.reduce((total, row) => {
    return total + row.amount * commissionRate(row.saleType);
  }, 0);

  return (
    <div className="merchant-statement-preview">
      <dl className="statement-summary">
        <div>
          <dt>Total sales</dt>
          <dd>{formatMoney(totalSales)}</dd>
        </div>

        <div>
          <dt>Outlet</dt>
          <dd>
            {OUTLET_ID} / {OUTLET_NAME}
          </dd>
        </div>

        <div>
          <dt>Commission</dt>
          <dd>{formatMoney(commissionTotal)}</dd>
        </div>
      </dl>

      <ReportTable
        columns={["Product Type", "Sales", "Rate", "Commission"]}
        rows={[
          ...commissions,
          [
            "Total commission",
            formatMoney(totalSales),
            "",
            formatMoney(commissionTotal)
          ]
        ]}
      />
    </div>
  );
}

function ReportTable({ columns, rows }) {
  if (!rows.length) {
    return (
      <div className="empty-state">
        No successful sales in the loaded rows.
      </div>
    );
  }

  return (
    <div className="report-mini-table-wrap">
      <table className="report-mini-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => {
            const isSummaryRow = rowIndex === rows.length - 1;

            return (
              <tr
                key={`report-row-${rowIndex}-${row.join("-")}`}
                className={isSummaryRow ? "report-summary-row" : undefined}
              >
                {row.map((value, cellIndex) => (
                  <td key={`report-cell-${rowIndex}-${cellIndex}`}>
                    {value}
                  </td>
                ))}
              </tr>
            );
          })}
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
    userId: isAirtime
      ? row.merchant_name || row.user || ELECTRICITY_USER
      : ELECTRICITY_USER,
    userName: "Not Set",
    saleType,
    provider: isAirtime
      ? row._detail || row.product_name || "Airtime"
      : ELECTRICITY_PROVIDER,
    reference: row._reference || row.meter_number || row.phonenumber || "",
    amount: toNumber(row.amount),
    status: row.status
  };
}

function groupRows(rows, keys) {
  const groups = rows.reduce((current, row) => {
    const groupKey = keys.map((name) => row[name] || "").join("|");

    const existing =
      current.get(groupKey) ||
      keys.reduce(
        (item, name) => ({
          ...item,
          [name]: row[name] || ""
        }),
        { amount: 0 }
      );

    existing.amount += row.amount;
    current.set(groupKey, existing);

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