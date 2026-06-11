import React from "react";
import { Loader2 } from "lucide-react";

export function Button({ children, icon: Icon, loading = false, variant = "primary", ...props }) {
  return (
    <button className={`bp-button ${variant}`} disabled={loading || props.disabled} {...props}>
      {loading ? <Loader2 className="spin" size={17} /> : Icon ? <Icon size={17} /> : null}
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
  const good = normalized.includes("SUCCESS") || normalized.includes("READY");
  const pending = normalized.includes("PENDING") || normalized.includes("NEEDED");

  return (
    <span className={`status-badge ${good ? "good" : pending ? "pending" : "bad"}`}>
      {normalized}
    </span>
  );
}
