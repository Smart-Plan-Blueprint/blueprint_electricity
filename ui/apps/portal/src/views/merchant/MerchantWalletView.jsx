import { Percent, Receipt, Wallet } from "lucide-react";
import { MetricCard, Section, StatusBadge } from "@blueprint/ui";
import { formatMoney } from "../../utils/formatters";

export default function MerchantWalletView({ merchant, stats }) {
  const rate = Number(merchant.commission_rate || 0);
  const commissionEarned = (stats.totalAmount || 0) * (rate / 100);

  return (
    <div className="view-stack">
      <div className="metrics-grid">
        <MetricCard icon={Wallet} label="Available balance" value={formatMoney(merchant.balance)} />
        <MetricCard icon={Percent} label="Commission rate" value={`${rate.toFixed(2)}%`} />
        <MetricCard icon={Receipt} label="Commission earned" value={formatMoney(commissionEarned)} />
        <MetricCard icon={Receipt} label="Successful sales" value={formatMoney(stats.totalAmount)} />
      </div>

      <Section title="Wallet movements" icon={Wallet}>
        {merchant.ledger?.length ? (
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
      </Section>

      <p className="inline-notice">Top-ups are processed by Smart Plan Blueprint. Contact your account manager to add float.</p>
    </div>
  );
}
