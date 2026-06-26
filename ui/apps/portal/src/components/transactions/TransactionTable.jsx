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

const columns = [
  { key: "created_at", label: "Time" },
  { key: "transaction_id", label: "Transaction ID", cls: "col-txid" },
  { key: "_type", label: "Type" },
  { key: "_reference", label: "Meter / phone" },
  { key: "merchant_name", label: "Merchant" },
  { key: "status", label: "Result" },
  { key: "amount", label: "Amount", cls: "col-amount" }
];

export default function TransactionTable({ rows, reports, loading, onRefresh, onSelectRow, meta, compact = false }) {
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

  const total = meta?.total ?? rows.length;
  const perPage = meta?.per_page || rows.length || 1;
  const current = meta?.current_page || 1;
  const start = total === 0 ? 0 : (current - 1) * perPage + 1;
  const end = total === 0 ? 0 : Math.min(total, start + rows.length - 1);

  return (
    <>
      {meta ? (
        <p className="table-meta-banner">
          Showing {start.toLocaleString()}–{end.toLocaleString()} of {total.toLocaleString()} rows.
        </p>
      ) : null}

      <div className={`table-wrap ${compact ? "compact-table-wrap" : ""}`}>
        <table className={compact ? "compact-table" : ""}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={col.cls || ""}>
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
                role="button"
                aria-label={`View transaction ${item.transaction_id || "details"}`}
                onClick={() => onSelectRow?.(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectRow?.(item);
                  }
                }}
                tabIndex={0}
              >
                <td data-label="Time">{formatDateTime(item.created_at)}</td>
                <td data-label="Transaction ID" className="col-txid">{item.transaction_id || "N/A"}</td>
                <td data-label="Type"><TypeBadge type={item._type || "electricity"} /></td>
                <td data-label="Meter / phone">{item._reference || item.meter_number || "—"}</td>
                <td data-label="Merchant">{item.merchant_name || item.merchant?.name || "—"}</td>
                <td data-label="Result"><StatusBadge status={item.status || "UNKNOWN"} /></td>
                <td data-label="Amount" className="col-amount">{formatMoney(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
