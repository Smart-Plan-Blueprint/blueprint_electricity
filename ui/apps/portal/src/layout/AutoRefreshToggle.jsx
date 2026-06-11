export default function AutoRefreshToggle({ enabled, onToggle }) {
  return (
    <button type="button" className={`auto-refresh ${enabled ? "on" : ""}`} onClick={onToggle}>
      <span className="auto-dot" />
      Auto refresh {enabled ? "on" : "off"}
    </button>
  );
}
