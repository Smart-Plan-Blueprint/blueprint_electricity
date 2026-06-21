import { useEffect } from "react";
import { X } from "lucide-react";
import { StatusBadge } from "@blueprint/ui";
import { formatMoney } from "../../utils/formatters";

export default function TransactionDrawer({ row, onClose }) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fields = [
    ["Transaction", row.transaction_id],
    ["Amount", formatMoney(row.amount)],
    ["Meter", row.meter_number],
    ["Merchant", row.merchant_name || row.merchant?.name || "Smart Plan Blueprint"],
    ["Result", row.status],
    ["Date and time", row.created_at]
  ];

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-drawer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="drawer-header">
          <div>
            <p className="eyebrow">Transaction</p>
            <h2 id="transaction-drawer-title">{row.transaction_id || "N/A"}</h2>
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="drawer-status">
          <StatusBadge status={row.status || "UNKNOWN"} />
        </div>
        <dl className="drawer-list">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || "N/A"}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}
