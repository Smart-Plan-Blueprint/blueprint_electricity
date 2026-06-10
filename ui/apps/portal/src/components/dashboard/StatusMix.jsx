export default function StatusMix({ stats, onStatusFilter }) {
  const items = [
    { tone: "success", label: "Success", count: stats.successCount, status: "SUCCESS" },
    { tone: "failed", label: "Failed", count: stats.failedCount, status: "FAILED" },
    { tone: "pending", label: "Pending / other", count: stats.pendingCount, status: "PENDING" }
  ];

  return (
    <div className="status-mix">
      <div style={{ "--value": `${stats.successRate}%` }}>
        <strong>{stats.successRate}%</strong>
        <span>successful</span>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.tone}>
            <button type="button" onClick={() => onStatusFilter?.(item.status)}>
              <span className={`dot ${item.tone}`} />
              <span className="status-label">{item.label}</span>
              <span className="status-count">{item.count}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
