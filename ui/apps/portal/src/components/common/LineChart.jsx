import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactMoney, formatMoney, shortDate } from "../../utils/formatters";
import { peakDay } from "../../utils/helpers";

// Mirrors design tokens (SVG presentation attributes don't resolve CSS var()).
const ACCENT = "#3f7bd9";
const SURFACE = "#0a1421";
const GRID = "rgba(157, 181, 207, 0.18)";
const CHART_MARGIN = { top: 8, right: 12, bottom: 0, left: 4 };
const ACTIVE_DOT = { r: 4, fill: ACCENT, stroke: SURFACE, strokeWidth: 2 };
const TOOLTIP_CURSOR = { stroke: GRID };

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-label">{shortDate(label)}</span>
      <span className="chart-tooltip-value">
        <i style={{ background: ACCENT }} />
        {formatMoney(payload[0].value)}
      </span>
    </div>
  );
}

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

  const data = rows.map((row) => ({ date: row.date, amount: Number(row.amount) || 0 }));

  return (
    <div
      className="chart-wrap chart-wrap--tall"
      role="img"
      aria-label="Daily transaction revenue trend"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={CHART_MARGIN}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity="0.18" />
              <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={24}
          />
          <YAxis
            width={56}
            tickFormatter={formatCompactMoney}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={TrendTooltip} cursor={TOOLTIP_CURSOR} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke={ACCENT}
            strokeWidth={2.5}
            fill="url(#trendFill)"
            dot={false}
            activeDot={ACTIVE_DOT}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="line-chart-summary">
        <span>Peak day</span>
        <strong>{peakDay(rows)}</strong>
      </div>
    </div>
  );
}
