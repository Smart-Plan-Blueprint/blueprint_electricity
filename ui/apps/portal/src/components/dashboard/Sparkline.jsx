export default function Sparkline({ rows }) {
  if (!rows || rows.length < 2) {
    return null;
  }

  const values = rows.map((row) => row.amount);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const width = 280;
  const height = 52;
  const step = width / (values.length - 1);
  const points = values.map((value, index) => [index * step, height - ((value - min) / span) * height]);
  const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg className="hero-spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <path className="hero-spark-area" d={area} />
      <path className="hero-spark-line" d={line} />
      <circle className="hero-spark-dot" cx={lastX} cy={lastY} r="3" />
    </svg>
  );
}
