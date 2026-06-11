import { StatusBadge } from "@blueprint/ui";
import { formatMoney } from "../../utils/formatters";

export default function AirtimeTable({ rows, loading }) {
  if (loading && !rows.length) {
    return <div className="empty-state">Loading airtime transactions...</div>;
  }

  if (!rows.length) {
    return <div className="empty-state">No airtime transactions found.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Transaction</th>
            <th>Phone</th>
            <th>Product</th>
            <th>Merchant</th>
            <th>Amount</th>
            <th>Result</th>
            <th>Date and time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.transaction_id || item.id}>
              <td>{item.transaction_id || "N/A"}</td>
              <td>{item.phonenumber || "N/A"}</td>
              <td>{item.product_name || "N/A"}</td>
              <td>{item.merchant_name || "N/A"}</td>
              <td>{formatMoney(item.amount)}</td>
              <td><StatusBadge status={item.status || "UNKNOWN"} /></td>
              <td>{item.created_at || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
