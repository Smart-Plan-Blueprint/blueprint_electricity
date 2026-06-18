import { formatMoney, shortDate } from "../../utils/formatters";

export default function BarChart({ rows }) {
  const max = Math.max(...rows.map((row) => row.amount), 1);

  if (!rows.length) {
    return <div className="empty-state">No dated transactions to show yet.</div>;
  }

  return (
    <div className="bar-chart">
      {rows.map((row) => (
        <div className="bar-row" key={row.date}>
          <span>{shortDate(row.date)}</span>
          <div>
            <i style={{ width: `${Math.max((row.amount / max) * 100, 2)}%` }} />
          </div>
          <strong>{formatMoney(row.amount)}</strong>
        </div>
      ))}
    </div>
  );
}
