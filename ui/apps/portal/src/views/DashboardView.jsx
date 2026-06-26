import { Activity, ChartLine, Gauge, ReceiptText, TrendingUp, XCircle } from "lucide-react";
import { Button, MetricCard, Section } from "@blueprint/ui";
import RangePicker from "../components/dashboard/RangePicker";
import LineChart from "../components/common/LineChart";
import StatusMix from "../components/common/StatusMix";
import TopMeters from "../components/dashboard/TopMeters";
import RecentActivity from "../components/dashboard/RecentActivity";
import { formatMoney } from "../utils/formatters";
import { rangeLabel } from "../utils/helpers";
import { deltaProps } from "../utils/stats";

export default function DashboardView({ stats, rows, loading, range, onSelectRange, onStatusFilter, onSelectRow, onOpenReports }) {
  const isLoading = loading === "reports" && !rows.length;
  const dash = "—";

  return (
    <div className="view-stack">
      <div className="dashboard-toolbar">
        <div>
          <p className="eyebrow">{rangeLabel(range)}</p>
          <p className="dashboard-toolbar__sub">Successful electricity &amp; airtime sales overview</p>
        </div>
        <RangePicker range={range} onSelectRange={onSelectRange} />
      </div>

      {/* KPI strip */}
      <section className="metrics-grid" aria-label="Dashboard totals">
        <MetricCard
          icon={ReceiptText}
          label="Revenue"
          value={isLoading ? dash : formatMoney(stats.totalAmount)}
          sub={`${stats.successCount} successful sales`}
          {...deltaProps(stats.trends?.total_amount, "pct")}
        />
        <MetricCard
          icon={Activity}
          label="Transactions"
          value={isLoading ? dash : String(stats.totalCount)}
          sub={`avg ${formatMoney(stats.averageAmount)} per sale`}
          {...deltaProps(stats.trends?.total_count, "pct")}
        />
        <MetricCard
          icon={Gauge}
          label="Success rate"
          value={isLoading ? dash : `${stats.successRate}%`}
          sub={`${stats.successCount} complete`}
        />
        <MetricCard
          icon={XCircle}
          label="Failed"
          value={isLoading ? dash : String(stats.failedCount)}
          tone="red"
          sub={`${formatMoney(stats.failedAmount)} at risk`}
          {...deltaProps(stats.trends?.failed_count, "pct", true)}
        />
      </section>

      {/* Trend card */}
      <Section
        title="Money movement"
        subtitle="Successful sales value by day"
        icon={ChartLine}
        action={<Button variant="ghost" onClick={onOpenReports}>Detailed reports →</Button>}
      >
        <LineChart rows={stats.dailyTotals} />
      </Section>

      {/* Recent activity + side cards */}
      <div className="dashboard-grid--overview">
        <Section
          title="Recent activity"
          subtitle={`${rows.length} latest transactions`}
          icon={Activity}
          action={<Button variant="ghost" onClick={onOpenReports}>View all</Button>}
        >
          <RecentActivity rows={rows.slice(0, 8)} onSelectRow={onSelectRow} />
        </Section>

        <div className="dashboard-side">
          <Section title="Top meters" subtitle="By volume in this period" icon={TrendingUp}>
            <TopMeters meters={stats.topMeters} />
          </Section>
          <Section title="Transaction health" icon={Gauge}>
            <StatusMix stats={stats} onStatusFilter={onStatusFilter} />
          </Section>
        </div>
      </div>
    </div>
  );
}
