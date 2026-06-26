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
const ELEC = "#3f7bd9";
const AIR = "#1d8f8a";
const GRID = "rgba(157, 181, 207, 0.18)";
const CHART_MARGIN = { top: 8, right: 12, bottom: 0, left: 4 };
const TOOLTIP_CURSOR = { stroke: GRID };

function buildRowDays(rows) {
  const map = new Map();

  (rows || []).forEach((row) => {
    const date = (row.created_at || "").slice(0, 10);
    if (!date) return;
    map.set(date, (map.get(date) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

function normalizeDays(days) {
  return (days || [])
    .map((day) => ({
      date: day.date,
      count: Number(day.count ?? day.transactions ?? day.total_count ?? 0)
    }))
    .filter((day) => day.date);
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

export default function ServiceCompareChart({
  electricityDays = [],
  electricityRows = [],
  airtimeRows = []
}) {
  const rowElectricityDays = buildRowDays(electricityRows);
  const elecDays = rowElectricityDays.length ? rowElectricityDays : normalizeDays(electricityDays);
  const airtimeDays = buildRowDays(airtimeRows);
  const allDates = [...new Set([...elecDays.map((d) => d.date), ...airtimeDays.map((d) => d.date)])].sort();

  if (allDates.length < 2) {
    return <div className="empty-state">Not enough data to compare service trends.</div>;
  }

  const elecMap = Object.fromEntries(elecDays.map((d) => [d.date, d.count ?? 0]));
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
