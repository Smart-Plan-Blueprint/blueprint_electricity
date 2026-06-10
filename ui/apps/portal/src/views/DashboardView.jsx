import { Activity, BarChart3, CheckCircle2, Gauge, PlugZap, ReceiptText, TrendingUp, XCircle } from "lucide-react";
import { MetricCard, Section } from "@blueprint/ui";
import HeroStat from "../components/dashboard/HeroStat";
import HeroTrend from "../components/dashboard/HeroTrend";
import Sparkline from "../components/dashboard/Sparkline";
import RangePicker from "../components/dashboard/RangePicker";
import LineChart from "../components/dashboard/LineChart";
import StatusMix from "../components/dashboard/StatusMix";
import TopMeters from "../components/dashboard/TopMeters";
import InsightsSection from "../components/dashboard/InsightsSection";
import TransactionTable from "../components/transactions/TransactionTable";
import { formatMoney } from "../utils/formatters";
import { rangeLabel } from "../utils/helpers";
import { deltaProps } from "../utils/stats";

export default function DashboardView({ stats, rows, reports, loading, range, onSelectRange, onRefresh, onStatusFilter, onSelectRow }) {
  const isLoading = loading === "reports" && !rows.length;

  return (
    <div className="view-stack">
      <section className="dashboard-hero">
        <div className="hero-main">
          <p className="eyebrow">{rangeLabel(range)}</p>
          <div className="hero-amount">
            <h2>{formatMoney(stats.totalAmount)}</h2>
            <HeroTrend value={stats.trends?.total_amount} />
          </div>
          <span>Money from successful electricity purchases in this period.</span>
          <Sparkline rows={stats.dailyTotals} />
          <RangePicker range={range} onSelectRange={onSelectRange} />
        </div>
        <div className="hero-stat-grid">
          <HeroStat icon={Gauge} tone="emerald" label="Success rate" value={`${stats.successRate}%`} />
          <HeroStat icon={PlugZap} tone="amber" label="Unique meters" value={String(stats.uniqueMeters)} />
          <HeroStat icon={ReceiptText} tone="sky" label="Avg. sale" value={formatMoney(stats.averageAmount)} />
        </div>
      </section>

      <section className="metrics-grid" aria-label="Dashboard totals">
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
          {...deltaProps(stats.trends?.failed_count, "pct", true)}
        />
        <MetricCard
          icon={Gauge}
          label="Success rate"
          value={isLoading ? "—" : `${stats.successRate}%`}
          {...deltaProps(stats.trends?.success_rate, "points")}
        />
      </section>

      <div className="dashboard-grid">
        <Section title="Money by day" icon={BarChart3}>
          <LineChart rows={stats.dailyTotals} />
        </Section>
        <Section title="Success vs problems" icon={Gauge}>
          <StatusMix stats={stats} onStatusFilter={onStatusFilter} />
        </Section>
      </div>

      <div className="dashboard-grid">
        <Section title="Most active meters" icon={TrendingUp}>
          <TopMeters meters={stats.topMeters} />
        </Section>
        <Section title="Latest transactions" icon={Activity}>
          <TransactionTable rows={rows.slice(0, 6)} reports={reports} loading={loading} onRefresh={onRefresh} onSelectRow={onSelectRow} compact />
        </Section>
      </div>

      <InsightsSection insights={stats.insights} />
    </div>
  );
}
