import { useMemo, useState } from "react";
import { StatusBadge } from "@blueprint/ui";
import TableSkeleton from "../common/TableSkeleton";
import SortIcon from "./SortIcon";
import { formatDateTime, formatMoney } from "../../utils/formatters";
import { sortRows } from "../../utils/helpers";

function TypeBadge({ type }) {
  return (
    <span className={`type-badge type-${type}`}>
      {type === "airtime" ? "Airtime" : "Electricity"}
    </span>
  );
}

export default function TransactionTable({ rows, reports, loading, onRefresh, onSelectRow, compact = false }) {
  const [sort, setSort] = useState({ key: "", dir: "asc" });

  const sortedRows = useMemo(() => sortRows(rows, sort), [rows, sort]);

  function toggleSort(key) {
    setSort((current) => {
      if (current.key !== key) return { key, dir: "asc" };
      return { key, dir: current.dir === "asc" ? "desc" : "asc" };
    });
  }

  if (loading === "reports" && !rows.length) {
    return <TableSkeleton compact={compact} />;
  }

  if (reports?.results === "FAILED") {
    return (
      <div className="error-banner">
        {reports.message || "Unable to load transactions."}
        {onRefresh ? <button type="button" onClick={onRefresh}>Retry</button> : null}
      </div>
    );
  }

  if (!rows.length) {
    return <div className="empty-state">No transactions match this view.</div>;
  }

  const columns = [
    { key: "transaction_id", label: "Transaction ID" },
    { key: "_type", label: "Type" },
    { key: "amount", label: "Amount" },
    { key: "_reference", label: "Meter / Phone" },
    { key: "_detail", label: "Product" },
    { key: "merchant_name", label: "Merchant" },
    { key: "status", label: "Result" },
    { key: "created_at", label: "Date and time" }
  ];

  return (
    <div className={`table-wrap ${compact ? "compact-table-wrap" : ""}`}>
      <table className={compact ? "compact-table" : ""}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>
                <button type="button" className="sort-head" onClick={() => toggleSort(col.key)}>
                  {col.label}
                  <SortIcon active={sort.key === col.key} dir={sort.dir} />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((item, index) => (
            <tr
              key={`${item._type || "row"}-${item.transaction_id || index}-${item.created_at || index}`}
              className="row-clickable"
              onClick={() => onSelectRow?.(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectRow?.(item);
                }
              }}
              tabIndex={0}
            >
              <td data-label="Transaction ID">{item.transaction_id || "N/A"}</td>
              <td data-label="Type"><TypeBadge type={item._type || "electricity"} /></td>
              <td data-label="Amount">{formatMoney(item.amount)}</td>
              <td data-label="Meter / Phone">{item._reference || item.meter_number || "—"}</td>
              <td data-label="Product">{item._detail || "—"}</td>
              <td data-label="Merchant">{item.merchant_name || item.merchant?.name || "—"}</td>
              <td data-label="Result"><StatusBadge status={item.status || "UNKNOWN"} /></td>
              <td data-label="Date and time">{formatDateTime(item.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
