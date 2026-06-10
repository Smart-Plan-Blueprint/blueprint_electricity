import { formatMoney } from "../../utils/formatters";

export default function TopMeters({ meters }) {
  if (!meters?.length) {
    return <div className="empty-state">No successful transactions to rank yet.</div>;
  }

  const max = Math.max(...meters.map((meter) => meter.amount), 1);

  return (
    <ol className="top-meters">
      {meters.map((meter, index) => (
        <li key={meter.meter_number}>
          <span className="top-rank">{index + 1}</span>
          <div className="top-body">
            <div className="top-line">
              <strong>{meter.meter_number}</strong>
              <span>{formatMoney(meter.amount)}</span>
            </div>
            <div className="top-bar">
              <i style={{ width: `${Math.max((meter.amount / max) * 100, 3)}%` }} />
            </div>
            <span className="top-meta">{meter.count} sale{meter.count === 1 ? "" : "s"}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
