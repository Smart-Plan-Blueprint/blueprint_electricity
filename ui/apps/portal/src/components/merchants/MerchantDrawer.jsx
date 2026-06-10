import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Ban,
  Copy,
  KeyRound,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Wallet,
  X
} from "lucide-react";
import { Button, Field, StatusBadge } from "@blueprint/ui";
import { formatMoney } from "../../utils/formatters";
import { maskApiKey } from "../../data/merchantData";

const tabs = [
  { key: "profile", label: "Profile & KYC" },
  { key: "wallet", label: "Wallet" },
  { key: "pricing", label: "Pricing" },
  { key: "api", label: "API access" }
];

export default function MerchantDrawer({ merchant, actions, onEdit, onClose }) {
  const [tab, setTab] = useState("profile");
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpNote, setTopUpNote] = useState("");
  const [commission, setCommission] = useState(String(merchant.commission_rate ?? ""));
  const [revealKey, setRevealKey] = useState(false);

  useEffect(() => {
    setTab("profile");
    setCommission(String(merchant.commission_rate ?? ""));
    setRevealKey(false);
  }, [merchant.id]);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function copyKey() {
    if (merchant.api_key) {
      navigator.clipboard?.writeText(merchant.api_key);
    }
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer drawer-wide" onClick={(event) => event.stopPropagation()}>
        <header className="drawer-header">
          <div>
            <p className="eyebrow">Merchant</p>
            <h2>{merchant.name}</h2>
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="drawer-status drawer-status-row">
          <StatusBadge status={merchant.status} />
          <StatusBadge status={`KYC ${merchant.kyc_status}`} />
          <button type="button" className="ghost-button" onClick={() => onEdit(merchant)}>
            <Pencil size={14} /> Edit
          </button>
        </div>

        <nav className="drawer-tabs">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              className={tab === item.key ? "active" : ""}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="drawer-body">
          {tab === "profile" ? (
            <>
              <dl className="drawer-list">
                <div><dt>Contact</dt><dd>{merchant.contact_name || "N/A"}</dd></div>
                <div><dt>Email</dt><dd>{merchant.email || "N/A"}</dd></div>
                <div><dt>Phone</dt><dd>{merchant.phone || "N/A"}</dd></div>
                <div><dt>Address</dt><dd>{merchant.address || "N/A"}</dd></div>
                <div><dt>Reg. number</dt><dd>{merchant.reg_number || "N/A"}</dd></div>
                <div><dt>Tax number</dt><dd>{merchant.tax_number || "N/A"}</dd></div>
                <div><dt>Onboarded</dt><dd>{merchant.created_at}</dd></div>
              </dl>

              <h4 className="drawer-subhead">KYC documents</h4>
              <ul className="doc-list">
                {merchant.kyc_documents.map((doc) => (
                  <li key={doc.type}>
                    <span>{doc.type}</span>
                    <StatusBadge status={doc.status} />
                  </li>
                ))}
              </ul>

              <div className="section-actions">
                {merchant.kyc_status !== "APPROVED" ? (
                  <Button icon={BadgeCheck} onClick={() => actions.approveKyc(merchant.id)}>Approve KYC</Button>
                ) : null}
                {merchant.kyc_status !== "REJECTED" ? (
                  <button type="button" className="ghost-button danger" onClick={() => actions.rejectKyc(merchant.id)}>
                    <Ban size={14} /> Reject
                  </button>
                ) : null}
                {merchant.status === "SUSPENDED" ? (
                  <button type="button" className="ghost-button" onClick={() => actions.setStatus(merchant.id, "ACTIVE")}>
                    <ShieldCheck size={14} /> Reactivate
                  </button>
                ) : (
                  <button type="button" className="ghost-button danger" onClick={() => actions.setStatus(merchant.id, "SUSPENDED")}>
                    <Ban size={14} /> Suspend
                  </button>
                )}
              </div>
            </>
          ) : null}

          {tab === "wallet" ? (
            <>
              <div className="wallet-balance">
                <span>Available balance</span>
                <strong>{formatMoney(merchant.balance)}</strong>
              </div>

              <div className="topup-row">
                <Field
                  label="Top-up amount (BWP)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={topUpAmount}
                  onChange={(event) => setTopUpAmount(event.target.value)}
                  placeholder="0.00"
                />
                <Field
                  label="Note"
                  value={topUpNote}
                  onChange={(event) => setTopUpNote(event.target.value)}
                  placeholder="Bank transfer ref"
                />
                <Button
                  icon={Wallet}
                  onClick={() => {
                    actions.topUp(merchant.id, topUpAmount, topUpNote);
                    setTopUpAmount("");
                    setTopUpNote("");
                  }}
                >
                  Top up
                </Button>
              </div>

              <h4 className="drawer-subhead">Ledger</h4>
              {merchant.ledger.length ? (
                <div className="table-wrap">
                  <table className="compact-table">
                    <thead>
                      <tr><th>Type</th><th>Amount</th><th>Balance</th><th>Note</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {merchant.ledger.map((entry) => (
                        <tr key={entry.id}>
                          <td><StatusBadge status={entry.type} /></td>
                          <td className={entry.amount < 0 ? "amount-neg" : "amount-pos"}>{formatMoney(entry.amount)}</td>
                          <td>{formatMoney(entry.balance_after)}</td>
                          <td>{entry.note}</td>
                          <td>{entry.created_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="empty-state">No wallet movements yet.</div>}
            </>
          ) : null}

          {tab === "pricing" ? (
            <>
              <dl className="drawer-list">
                <div><dt>Pricing model</dt><dd>Commission on vend value</dd></div>
                <div><dt>Current rate</dt><dd>{Number(merchant.commission_rate || 0).toFixed(2)}%</dd></div>
              </dl>
              <div className="topup-row">
                <Field
                  label="Commission rate (%)"
                  type="number"
                  step="0.1"
                  min="0"
                  value={commission}
                  onChange={(event) => setCommission(event.target.value)}
                />
                <Button icon={BadgeCheck} onClick={() => actions.setCommission(merchant.id, commission)}>Save rate</Button>
              </div>
              <p className="inline-notice">Commission is calculated per successful electricity vend and credited to the merchant wallet.</p>
            </>
          ) : null}

          {tab === "api" ? (
            <>
              <dl className="drawer-list">
                <div><dt>Key status</dt><dd><StatusBadge status={merchant.api_key_status} /></dd></div>
                <div><dt>Last used</dt><dd>{merchant.api_key_last_used || "Never"}</dd></div>
              </dl>

              {merchant.api_key ? (
                <div className="api-key-box">
                  <code>{revealKey ? merchant.api_key : maskApiKey(merchant.api_key)}</code>
                  <div className="api-key-actions">
                    <button type="button" onClick={() => setRevealKey((value) => !value)}>{revealKey ? "Hide" : "Reveal"}</button>
                    <button type="button" onClick={copyKey}><Copy size={13} /> Copy</button>
                  </div>
                </div>
              ) : (
                <div className="empty-state">No API key issued. Approve KYC or generate one below.</div>
              )}

              <div className="section-actions">
                <Button icon={RefreshCw} onClick={() => actions.regenerateKey(merchant.id)}>
                  {merchant.api_key ? "Regenerate key" : "Generate key"}
                </Button>
                {merchant.api_key && merchant.api_key_status === "ACTIVE" ? (
                  <button type="button" className="ghost-button danger" onClick={() => actions.revokeKey(merchant.id)}>
                    <KeyRound size={14} /> Revoke
                  </button>
                ) : null}
              </div>
              <p className="inline-notice">This key authenticates the merchant against the vending API (<code>Authorization: Bearer …</code>). Regenerating immediately invalidates the previous key.</p>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
