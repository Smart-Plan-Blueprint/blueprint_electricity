import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { shortDate } from "../../utils/formatters";

// Mirrors design tokens (SVG presentation attributes don't resolve CSS var()).
const ELEC = "#174f9c";
const AIR = "#0f9b8e";
const GRID = "rgba(15, 33, 56, 0.08)";
const CHART_MARGIN = { top: 8, right: 12, bottom: 0, left: 4 };
const TOOLTIP_CURSOR = { stroke: GRID };

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

function CompareTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-label">{shortDate(label)}</span>
      {payload.map((entry) => (
        <span className="chart-tooltip-value" key={entry.dataKey}>
          <i style={{ background: entry.stroke }} />
          {entry.name}: {entry.value}
        </span>
      ))}
    </div>
  );
}

export default function ServiceCompareChart({ electricityDays = [], airtimeRows = [] }) {
  const airtimeDays = buildAirtimeDays(airtimeRows);
  const allDates = [...new Set([...electricityDays.map((d) => d.date), ...airtimeDays.map((d) => d.date)])].sort();

  if (allDates.length < 2) {
    return <div className="empty-state">Not enough data to compare service trends.</div>;
  }

  const elecMap = Object.fromEntries(electricityDays.map((d) => [d.date, d.count ?? 0]));
  const airMap = Object.fromEntries(airtimeDays.map((d) => [d.date, d.count]));

  const data = allDates.map((date) => ({
    date,
    electricity: elecMap[date] ?? 0,
    airtime: airMap[date] ?? 0,
  }));

  return (
    <div
      className="chart-wrap chart-wrap--tall"
      role="img"
      aria-label="Electricity and airtime transaction comparison"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={24}
          />
          <YAxis width={40} allowDecimals={false} tickLine={false} axisLine={false} />
          <Tooltip content={CompareTooltip} cursor={TOOLTIP_CURSOR} />
          <Legend iconType="plainline" />
          <Line type="monotone" dataKey="electricity" name="Electricity" stroke={ELEC} strokeWidth={2.2} dot={false} />
          <Line type="monotone" dataKey="airtime" name="Airtime" stroke={AIR} strokeWidth={2.2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
