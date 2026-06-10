import { useMemo, useState } from "react";
import { StatusBadge } from "@blueprint/ui";
import TableSkeleton from "../common/TableSkeleton";
import SortIcon from "../dashboard/SortIcon";
import { formatMoney } from "../../utils/formatters";
import { sortRows } from "../../utils/helpers";

export default function TransactionTable({ rows, reports, loading, onRefresh, onSelectRow, compact = false }) {
  const [sort, setSort] = useState({ key: "", dir: "asc" });

  const sortedRows = useMemo(() => sortRows(rows, sort), [rows, sort]);

  function toggleSort(key) {
    setSort((current) => {
      if (current.key !== key) {
        return { key, dir: "asc" };
      }
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
    { key: "transaction_id", label: "Transaction" },
    { key: "amount", label: "Amount", numeric: true },
    { key: "meter_number", label: "Meter" },
    { key: "merchant_name", label: "Merchant" },
    { key: "status", label: "Result" },
    { key: "created_at", label: "Date and time" },
    { key: "view", label: "" }
  ];

  return (
    <div className={`table-wrap ${compact ? "compact-table-wrap" : ""}`}>
      <table className={compact ? "compact-table" : ""}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>
                <button type="button" className="sort-head" onClick={() => toggleSort(column.key)}>
                  {column.label}
                  <SortIcon active={sort.key === column.key} dir={sort.dir} />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((item, index) => (
            <tr
              key={`${item.transaction_id || "row"}-${item.created_at || index}`}
              className="row-clickable"
              onClick={() => onSelectRow?.(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectRow?.(item);
                }
              }}
              tabIndex={0}
              aria-label={`View transaction ${item.transaction_id || index + 1}`}
            >
              <td>{item.transaction_id || "N/A"}</td>
              <td>{formatMoney(item.amount)}</td>
              <td>{item.meter_number || "N/A"}</td>
              <td>{item.merchant_name || item.merchant?.name || "Smart Plan Blueprint"}</td>
              <td><StatusBadge status={item.status || "UNKNOWN"} /></td>
              <td>{item.created_at || "N/A"}</td>
              <td>
                <button
                  type="button"
                  className="view-row-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectRow?.(item);
                  }}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
