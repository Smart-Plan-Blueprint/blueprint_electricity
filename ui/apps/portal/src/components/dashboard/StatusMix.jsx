export default function StatusMix({ stats, onStatusFilter }) {
  const items = [
    { tone: "success", label: "Success", count: stats.successCount, status: "SUCCESS" },
    { tone: "failed", label: "Failed", count: stats.failedCount, status: "FAILED" },
    { tone: "pending", label: "Pending", count: stats.pendingCount, status: "PENDING" }
  ];

  return (
    <div className="status-mix">
      <div className="status-rate">
        <div className="status-rate-head">
          <span>Success rate</span>
          <strong>{stats.successRate}%</strong>
        </div>
        <div className="status-rate-bar">
          <i style={{ width: `${stats.successRate}%` }} />
        </div>
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
