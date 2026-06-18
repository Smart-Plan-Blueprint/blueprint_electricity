import { formatDateTime, formatMoney } from "../../utils/formatters";

export default function RecentActivity({ rows, onSelectRow }) {
  if (!rows.length) {
    return <div className="empty-state">No transactions yet.</div>;
  }

  return (
    <ul className="activity-list">
      {rows.map((item, index) => {
        const status = String(item.status || "unknown").toLowerCase();
        return (
          <li key={`${item.transaction_id || index}-${item.created_at || index}`}>
            <button type="button" onClick={() => onSelectRow?.(item)}>
              <span className={`activity-dot ${status}`} title={status} />
              <span className="activity-main">
                <strong>{formatMoney(item.amount)}</strong>
                <em>{item._type === "airtime" ? "Airtime" : "Electricity"} · {item._reference || item.meter_number || item.transaction_id || "—"}</em>
              </span>
              <span className="activity-side">
                <span className={`activity-status ${status}`}>{status}</span>
                <time>{formatDateTime(item.created_at)}</time>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
