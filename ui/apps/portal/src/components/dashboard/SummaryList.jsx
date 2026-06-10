import { formatMoney } from "../../utils/formatters";

export default function SummaryList({ stats }) {
  return (
    <dl className="summary-list">
      <div><dt>Average transaction</dt><dd>{formatMoney(stats.averageAmount)}</dd></div>
      <div><dt>Receipts issued</dt><dd>{stats.receiptCount}</dd></div>
      <div><dt>Unique meters</dt><dd>{stats.uniqueMeters}</dd></div>
      <div><dt>Failed value</dt><dd>{formatMoney(stats.failedAmount)}</dd></div>
    </dl>
  );
}
