import { formatCompactMoney, formatMoney, shortDate } from "../../utils/formatters";
import { peakDay, smoothPath } from "../../utils/helpers";

export default function LineChart({ rows }) {
  if (!rows.length) {
    return <div className="empty-state">No dated transactions to show yet. The trend appears once sales come in.</div>;
  }

  if (rows.length < 3) {
    return (
      <div className="sparse-days">
        {rows.map((row) => (
          <div className="sparse-day" key={row.date}>
            <span>{shortDate(row.date)}</span>
            <strong>{formatMoney(row.amount)}</strong>
          </div>
        ))}
        <p className="sparse-note">A trend line appears once there are a few days of activity.</p>
      </div>
    );
  }

  const width = 720;
  const height = 220;
  const padding = { top: 20, right: 28, bottom: 44, left: 58 };
  const values = rows.map((row) => Number(row.amount) || 0);
  const max = Math.max(...values, 1);
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const step = rows.length > 1 ? innerWidth / (rows.length - 1) : innerWidth;
  const points = rows.map((row, index) => {
    const x = padding.left + index * step;
    const y = padding.top + innerHeight - ((Number(row.amount) || 0) / max) * innerHeight;
    return { ...row, x, y };
  });
  const line = smoothPath(points);
  const area = `${line} L${padding.left + innerWidth},${padding.top + innerHeight} L${padding.left},${padding.top + innerHeight} Z`;
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((value) => ({
    y: padding.top + innerHeight - value * innerHeight,
    label: formatCompactMoney(max * value)
  }));

  return (
    <div className="line-chart-wrap">
      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Daily transaction amount line graph">
        <defs>
          <linearGradient id="reportLineFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2b6ce0" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#2b6ce0" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {gridLines.map((lineItem) => (
          <g key={lineItem.y}>
            <line className="line-chart-grid" x1={padding.left} x2={padding.left + innerWidth} y1={lineItem.y} y2={lineItem.y} />
            <text className="line-chart-label" x={padding.left - 10} y={lineItem.y + 4} textAnchor="end">{lineItem.label}</text>
          </g>
        ))}
        <path className="line-chart-area" d={area} />
        <path className="line-chart-path" d={line} />
        {points.map((point) => (
          <g key={point.date}>
            <circle className="line-chart-dot-halo" cx={point.x} cy={point.y} r="9" />
            <circle className="line-chart-dot" cx={point.x} cy={point.y} r="4.8" />
            <text className="line-chart-date" x={point.x} y={height - 10} textAnchor="middle">{shortDate(point.date)}</text>
          </g>
        ))}
      </svg>
      <div className="line-chart-summary">
        <span>Peak day</span>
        <strong>{peakDay(rows)}</strong>
      </div>
    </div>
  );
}
