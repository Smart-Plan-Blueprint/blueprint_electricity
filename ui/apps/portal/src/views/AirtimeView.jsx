import { CheckCircle2, Gauge, Phone, ReceiptText } from "lucide-react";
import { MetricCard, Section } from "@blueprint/ui";
import AirtimeTable from "../components/airtime/AirtimeTable";
import Pagination from "../components/transactions/Pagination";
import { formatMoney } from "../utils/formatters";

export default function AirtimeView({ reports, loading, onPage }) {
  const rows = reports?.data || [];
  const summary = reports?.summary || {};
  const meta = reports?.meta || null;

  return (
    <div className="view-stack">
      <section className="metrics-grid" aria-label="Airtime totals">
        <MetricCard icon={ReceiptText} label="Transactions" value={String(summary.total ?? "—")} />
        <MetricCard icon={CheckCircle2} label="Successful" value={String(summary.successful ?? "—")} tone="green" />
        <MetricCard icon={ReceiptText} label="Failed" value={String(summary.failed ?? "—")} tone="red" />
        <MetricCard icon={Gauge} label="Total value" value={summary.total_amount ? formatMoney(summary.total_amount) : "—"} />
      </section>

      <Section title="Airtime transactions" icon={Phone}>
        <AirtimeTable rows={rows} loading={loading} />
        <Pagination meta={meta} loading={loading ? "reports" : ""} onPage={onPage} />
      </Section>
    </div>
  );
}
