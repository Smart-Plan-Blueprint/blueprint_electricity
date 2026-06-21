import { Loader2 } from "lucide-react";

export function Button({ children, icon: Icon, loading = false, variant = "primary", className = "", ...props }) {
  return (
    <button
      className={`bp-button ${variant} ${className}`.trim()}
      disabled={loading || props.disabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? <Loader2 className="spin" size={17} aria-hidden="true" /> : Icon ? <Icon size={17} aria-hidden="true" /> : null}
      <span>{loading ? "Working..." : children}</span>
    </button>
  );
}

export function Field({ label, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

export function InlineNotice({ children }) {
  return <p className="inline-notice">{children}</p>;
}

export function MetricCard({ icon: Icon, label, value, tone = "default", delta = null, deltaTone = "neutral" }) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-icon">{Icon ? <Icon size={20} /> : null}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {delta ? <em className={`metric-delta ${deltaTone}`}>{delta}</em> : null}
      </div>
    </article>
  );
}

export function Section({ title, icon: Icon, children }) {
  return (
    <section className="bp-section">
      <header>
        <div className="section-title">
          {Icon ? <Icon size={19} /> : null}
          <h2>{title}</h2>
        </div>
      </header>
      {children}
    </section>
  );
}

export function StatusBadge({ status }) {
  const normalized = String(status || "UNKNOWN").toUpperCase();
  const good = ["SUCCESS", "READY", "ACTIVE", "APPROVED", "LIVE"].some((word) => normalized.includes(word));
  const pending = ["PENDING", "NEEDED", "DEMO"].some((word) => normalized.includes(word));

  return (
    <span className={`status-badge ${good ? "good" : pending ? "pending" : "bad"}`}>
      {normalized}
    </span>
  );
}
