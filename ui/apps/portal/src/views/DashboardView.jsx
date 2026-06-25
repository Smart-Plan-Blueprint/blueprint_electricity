import { Activity, ChartLine, FileSpreadsheet, Gauge, ReceiptText, TrendingUp, XCircle } from "lucide-react";
import { MetricCard, Section } from "@blueprint/ui";
import RangePicker from "../components/dashboard/RangePicker";
import LineChart from "../components/common/LineChart";
import StatusMix from "../components/common/StatusMix";
import TopMeters from "../components/dashboard/TopMeters";
import InsightsSection from "../components/dashboard/InsightsSection";
import ReportTabsPreview from "../components/dashboard/ReportTabsPreview";
import RecentActivity from "../components/dashboard/RecentActivity";
import { formatMoney } from "../utils/formatters";
import { rangeLabel } from "../utils/helpers";

export default function DashboardView({ stats, rows, reports, loading, range, onSelectRange, onRefresh, onStatusFilter, onSelectRow, onOpenReports }) {
  const isLoading = loading === "reports" && !rows.length;

  return (
    <div className="view-stack">
      <div className="dashboard-toolbar">
        <div>
          <p className="eyebrow">{rangeLabel(range)}</p>
          <p className="dashboard-toolbar__sub">Successful electricity &amp; airtime sales overview</p>
        </div>
        <RangePicker range={range} onSelectRange={onSelectRange} />
      </div>

      <section className="metrics-grid" aria-label="Dashboard totals">
        <MetricCard
          icon={ReceiptText}
          label="Transactions"
          value={isLoading ? "—" : String(stats.totalCount)}
          delta={`${stats.uniqueMeters} unique meter${stats.uniqueMeters === 1 ? "" : "s"}`}
        />
        <MetricCard
          icon={TrendingUp}
          label="Revenue"
          value={isLoading ? "—" : formatMoney(stats.totalAmount)}
          delta={`avg ${formatMoney(stats.averageAmount)} per sale`}
        />
        <MetricCard
          icon={Gauge}
          label="Success rate"
          value={isLoading ? "—" : `${stats.successRate}%`}
          delta={`${stats.successCount}/${stats.totalCount} complete`}
        />
        <MetricCard
          icon={XCircle}
          label="Failed"
          value={isLoading ? "—" : String(stats.failedCount)}
          tone="red"
          delta="need review"
        />
      </section>

      <InsightsSection insights={stats.insights} />

      <div className="dashboard-grid dashboard-grid--main">
        <Section title="Money by day" icon={ChartLine}>
          <LineChart rows={stats.dailyTotals} />
        </Section>
        <Section title="Transaction health" icon={Gauge}>
          <StatusMix stats={stats} onStatusFilter={onStatusFilter} />
        </Section>
      </div>

      <div className="dashboard-grid">
        <Section title="Latest transactions" icon={Activity}>
          <RecentActivity rows={rows.slice(0, 6)} onSelectRow={onSelectRow} />
        </Section>
        <Section title="Most active meters" icon={TrendingUp}>
          <TopMeters meters={stats.topMeters} />
        </Section>
      </div>

      <Section title="Report preview" icon={FileSpreadsheet}>
        <ReportTabsPreview rows={rows} compact onOpenReports={onOpenReports} />
      </Section>
    </div>
  );
}
