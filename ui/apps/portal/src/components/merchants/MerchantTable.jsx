import { StatusBadge } from "@blueprint/ui";
import { formatMoney } from "../../utils/formatters";

export default function MerchantTable({ merchants, onSelect }) {
  if (!merchants.length) {
    return <div className="empty-state">No merchants match this view.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Merchant</th>
            <th>Contact</th>
            <th>Wallet</th>
            <th>Commission</th>
            <th>KYC</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {merchants.map((merchant) => (
            <tr
              key={merchant.id}
              className="row-clickable"
              tabIndex={0}
              onClick={() => onSelect(merchant.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(merchant.id);
                }
              }}
              aria-label={`Open ${merchant.name}`}
            >
              <td>
                <strong>{merchant.name}</strong>
                <span className="cell-sub">{merchant.reg_number || "No reg. number"}</span>
              </td>
              <td>
                {merchant.contact_name || "N/A"}
                <span className="cell-sub">{merchant.email}</span>
              </td>
              <td>{formatMoney(merchant.balance)}</td>
              <td>{Number(merchant.commission_rate || 0).toFixed(2)}%</td>
              <td><StatusBadge status={merchant.kyc_status} /></td>
              <td><StatusBadge status={merchant.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
