export default function InsightsSection({ insights }) {
  const items = [
    ["Best time", insights?.best_window || "Watching transactions as they come in", "info"],
    ["Problem signal", insights?.risk_signal || "No unusual failed payments in this view", "warn"],
    ["Next step", insights?.action || "Refresh when you want the newest transactions", "good"]
  ];

  return (
    <div className="insight-strip" aria-label="What to watch">
      {items.map(([label, value, tone]) => (
        <article className={`insight-pill tone-${tone}`} key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </div>
  );
}
