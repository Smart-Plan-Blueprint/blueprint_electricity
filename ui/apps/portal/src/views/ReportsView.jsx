import { ArrowDownToLine, BarChart3, CalendarDays, CheckCircle2, FileSearch, Gauge, ReceiptText, TrendingUp } from "lucide-react";
import { Button, MetricCard, Section } from "@blueprint/ui";
import ReportFilters from "../components/transactions/ReportFilters";
import TransactionTable from "../components/transactions/TransactionTable";
import Pagination from "../components/transactions/Pagination";
import LineChart from "../components/dashboard/LineChart";
import StatusMix from "../components/dashboard/StatusMix";
import BarChart from "../components/dashboard/BarChart";
import SummaryList from "../components/dashboard/SummaryList";
import PlainInsights from "../components/dashboard/PlainInsights";
import { formatMoney } from "../utils/formatters";

export default function ReportsView({ filters, setFilters, updateForm, loading, onSubmit, onClear, onPreset, stats, rows, reports, meta, onExport, onSelectRow, onPage }) {
  return (
    <div className="view-stack">
      <ReportFilters filters={filters} setFilters={setFilters} updateForm={updateForm} loading={loading} onSubmit={onSubmit} onClear={onClear} onPreset={onPreset} />

      <section className="metrics-grid">
        <MetricCard icon={CalendarDays} label="Transactions found" value={String(stats.totalCount)} />
        <MetricCard icon={Gauge} label="Successful amount" value={formatMoney(stats.totalAmount)} />
        <MetricCard icon={CheckCircle2} label="Success rate" value={`${stats.successRate}%`} />
        <MetricCard icon={ReceiptText} label="Receipts issued" value={String(stats.receiptCount)} />
      </section>

      <div className="report-chart-grid">
        <Section title="Money over time" icon={TrendingUp}>
          <LineChart rows={stats.dailyTotals} />
        </Section>
        <Section title="Transaction results" icon={Gauge}>
          <StatusMix stats={stats} />
        </Section>
      </div>

      <div className="dashboard-grid">
        <Section title="Daily comparison" icon={BarChart3}>
          <BarChart rows={stats.dailyTotals} />
        </Section>
        <Section title="Quick summary" icon={FileSearch}>
          <SummaryList stats={stats} />
        </Section>
      </div>

      <PlainInsights stats={stats} />

      <Section title="Transactions in this report" icon={FileSearch}>
        <div className="section-actions">
          <Button icon={ArrowDownToLine} onClick={onExport} disabled={!rows.length}>Download Excel</Button>
        </div>
        <TransactionTable rows={rows} reports={reports} loading={loading} onSelectRow={onSelectRow} />
        <Pagination meta={meta} loading={loading} onPage={onPage} />
      </Section>
    </div>
  );
}
