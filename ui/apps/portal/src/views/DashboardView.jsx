import { Activity, BarChart3, CheckCircle2, Gauge, Phone, PlugZap, ReceiptText, TrendingUp, XCircle } from "lucide-react";
import { MetricCard, Section } from "@blueprint/ui";
import HeroTrend from "../components/dashboard/HeroTrend";
import RangePicker from "../components/dashboard/RangePicker";
import LineChart from "../components/dashboard/LineChart";
import StatusMix from "../components/dashboard/StatusMix";
import TopMeters from "../components/dashboard/TopMeters";
import InsightsSection from "../components/dashboard/InsightsSection";
import TransactionTable from "../components/transactions/TransactionTable";
import { formatMoney } from "../utils/formatters";
import { rangeLabel } from "../utils/helpers";
import { deltaProps } from "../utils/stats";

export default function DashboardView({ stats, rows, reports, loading, range, onSelectRange, onRefresh, onStatusFilter, onSelectRow, airtimeReports }) {
  const isLoading = loading === "reports" && !rows.length;
  const electricityCount = stats.totalCount ?? 0;
  const airtimeCount = airtimeReports?.summary?.total ?? 0;

  return (
    <div className="view-stack">
      <section className="dashboard-summary">
        <div className="summary-primary">
          <p className="eyebrow">{rangeLabel(range)}</p>
          <div className="hero-amount">
            <h2>{formatMoney(stats.totalAmount)}</h2>
            <HeroTrend value={stats.trends?.total_amount} />
          </div>
          <span className="summary-help">Money from successful electricity purchases in this period.</span>
          <p className="summary-meta">
            Avg. sale {formatMoney(stats.averageAmount)} · {stats.uniqueMeters} unique meter{stats.uniqueMeters === 1 ? "" : "s"}
          </p>
          <RangePicker range={range} onSelectRange={onSelectRange} />
        </div>
        <div className="summary-stat-grid" aria-label="Dashboard totals">
          <MetricCard
            icon={ReceiptText}
            label="Transactions"
            value={isLoading ? "—" : String(stats.totalCount)}
            {...deltaProps(stats.trends?.total_count, "pct")}
          />
          <MetricCard icon={CheckCircle2} label="Successful" value={isLoading ? "—" : String(stats.successCount)} tone="green" />
          <MetricCard
            icon={XCircle}
            label="Failed"
            value={isLoading ? "—" : String(stats.failedCount)}
            tone="red"
            {...deltaProps(stats.trends?.failed_count, "pct", true)}
          />
          <MetricCard
            icon={Gauge}
            label="Success rate"
            value={isLoading ? "—" : `${stats.successRate}%`}
            {...deltaProps(stats.trends?.success_rate, "points")}
          />
        </div>
      </section>

      <div className="dashboard-grid">
        <Section title="Money by day" icon={BarChart3}>
          <LineChart rows={stats.dailyTotals} />
        </Section>
        <Section title="Transaction health" icon={Gauge}>
          <StatusMix stats={stats} onStatusFilter={onStatusFilter} />
        </Section>
      </div>

      <div className="dashboard-grid">
        <Section title="Latest transactions" icon={Activity}>
          <TransactionTable rows={rows.slice(0, 6)} reports={reports} loading={loading} onRefresh={onRefresh} onSelectRow={onSelectRow} compact />
        </Section>
        <Section title="Most active meters" icon={TrendingUp}>
          <TopMeters meters={stats.topMeters} />
        </Section>
      </div>

      <InsightsSection insights={stats.insights} />
    </div>
  );
}
