import { shortDate } from "../../utils/formatters";
import { smoothPath } from "../../utils/helpers";

function buildAirtimeDays(airtimeRows) {
  const map = {};
  (airtimeRows || []).forEach((row) => {
    const date = (row.created_at || "").slice(0, 10);
    if (!date) return;
    map[date] = (map[date] || 0) + 1;
  });
  return Object.entries(map)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export default function ServiceCompareChart({ electricityDays = [], airtimeRows = [] }) {
  const airtimeDays = buildAirtimeDays(airtimeRows);

  // merge all dates
  const allDates = [...new Set([...electricityDays.map((d) => d.date), ...airtimeDays.map((d) => d.date)])].sort();

  if (allDates.length < 2) {
    return <div className="empty-state">Not enough data to compare service trends.</div>;
}

  const elecMap = Object.fromEntries(electricityDays.map((d) => [d.date, d.count ?? 0]));
  const airMap = Object.fromEntries(airtimeDays.map((d) => [d.date, d.count]));

  const elecValues = allDates.map((d) => elecMap[d] ?? 0);
  const airValues = allDates.map((d) => airMap[d] ?? 0);

  const width = 720;
  const height = 220;
  const padding = { top: 20, right: 28, bottom: 44, left: 48 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const max = Math.max(...elecValues, ...airValues, 1);
  const step = allDates.length > 1 ? innerWidth / (allDates.length - 1) : innerWidth;

  function toPoints(values) {
    return values.map((v, i) => ({
      x: padding.left + i * step,
      y: padding.top + innerHeight - (v / max) * innerHeight,
      value: v,
      date: allDates[i],
    }));
  }

  const elecPoints = toPoints(elecValues);
  const airPoints = toPoints(airValues);
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: padding.top + innerHeight - t * innerHeight,
    label: Math.round(max * t),
  }));

  return (
    <div className="line-chart-wrap">
      <div className="service-chart-legend">
        <span className="legend-electricity"><i />Electricity</span>
        <span className="legend-airtime"><i />Airtime</span>
      </div>
      <svg className="service-compare-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Electricity vs airtime transactions by day">
        <defs>
          <linearGradient id="elecFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2b6ce0" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#2b6ce0" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="airFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {gridLines.map((gl) => (
          <g key={gl.y}>
            <line className="line-chart-grid" x1={padding.left} x2={padding.left + innerWidth} y1={gl.y} y2={gl.y} />
            <text className="line-chart-label" x={padding.left - 8} y={gl.y + 4} textAnchor="end">{gl.label}</text>
          </g>
        ))}

        {/* electricity area + line */}
        <path
          d={`${smoothPath(elecPoints)} L${padding.left + innerWidth},${padding.top + innerHeight} L${padding.left},${padding.top + innerHeight} Z`}
          fill="url(#elecFill)"
        />
        <path d={smoothPath(elecPoints)} fill="none" stroke="#2b6ce0" strokeWidth="2.2" strokeLinecap="round" />
        {elecPoints.map((p) => (
          <circle key={p.date + "-e"} cx={p.x} cy={p.y} r="4" fill="#2b6ce0" />
        ))}

        {/* airtime area + line */}
        <path
          d={`${smoothPath(airPoints)} L${padding.left + innerWidth},${padding.top + innerHeight} L${padding.left},${padding.top + innerHeight} Z`}
          fill="url(#airFill)"
        />
        <path d={smoothPath(airPoints)} fill="none" stroke="#8b5cf6" strokeWidth="2.2" strokeLinecap="round" />
        {airPoints.map((p) => (
          <circle key={p.date + "-a"} cx={p.x} cy={p.y} r="4" fill="#8b5cf6" />
        ))}

        {/* date labels */}
        {elecPoints.map((p) => (
          <text key={p.date + "-lbl"} className="line-chart-date" x={p.x} y={height - 6} textAnchor="middle">{shortDate(p.date)}</text>
        ))}
      </svg>
    </div>
  );
}
