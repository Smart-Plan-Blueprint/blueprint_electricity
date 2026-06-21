import { useState } from "react";
import { CalendarDays, ChartLine, CheckCircle2, ChevronDown, FileSearch, Gauge, GitCompare, Phone, PlugZap, ReceiptText, TrendingUp, Zap } from "lucide-react";
import { MetricCard, Section } from "@blueprint/ui";
import ReportFilters from "../components/transactions/ReportFilters";
import TransactionTable from "../components/transactions/TransactionTable";
import Pagination from "../components/transactions/Pagination";
import LineChart from "../components/common/LineChart";
import StatusMix from "../components/common/StatusMix";
import SummaryList from "../components/reports/SummaryList";
import PlainInsights from "../components/reports/PlainInsights";
import ServiceCompareChart from "../components/reports/ServiceCompareChart";
import ServiceRaceCard from "../components/reports/ServiceRaceCard";
import { formatMoney } from "../utils/formatters";

const SERVICE_TABS = [
  { key: "all",         label: "All services",  icon: Zap },
  { key: "electricity", label: "Electricity",    icon: PlugZap },
  { key: "airtime",     label: "Airtime",        icon: Phone },
];

function buildAirtimeStats(airtimeReports) {
  const summary = airtimeReports?.summary || {};
  const total     = summary.total     ?? 0;
  const success   = summary.successful ?? 0;
  const failed    = total - success;
  return {
    totalCount:   total,
    successCount: success,
    failedCount:  failed,
    totalAmount:  0,
    successRate:  total ? Math.round((success / total) * 100) : 0,
    receiptCount: 0,
    dailyTotals:  [],
    topMeters:    [],
    insights:     [],
  };
}

function buildCombinedStats(elecStats, airtimeReports) {
  const airStats   = buildAirtimeStats(airtimeReports);
  const total      = elecStats.totalCount + airStats.totalCount;
  const success    = elecStats.successCount + airStats.successCount;
  return {
    ...elecStats,
    totalCount:   total,
    successCount: success,
    failedCount:  elecStats.failedCount + airStats.failedCount,
    successRate:  total ? Math.round((success / total) * 100) : 0,
    receiptCount: elecStats.receiptCount,
  };
}

export default function ReportsView({ filters, setFilters, updateForm, loading, onSubmit, onClear, onPreset, stats, rows, reports, meta, onSelectRow, onPage, airtimeReports }) {
  const [service, setService] = useState("all");
  const [showAnalytics, setShowAnalytics] = useState(false);

  const viewStats =
    service === "electricity" ? stats
    : service === "airtime"   ? buildAirtimeStats(airtimeReports)
    : buildCombinedStats(stats, airtimeReports);

  const isAirtimeOnly = service === "airtime";

  return (
    <div className="view-stack">

      {/* Global service selector */}
      <div className="service-tabs">
        {SERVICE_TABS.map(({ key, label, icon: Icon }) => (
          <button
            type="button"
            key={key}
            className={`service-tab${service === key ? " service-tab--active" : ""}`}
            onClick={() => setService(key)}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <ServiceRaceCard stats={stats} airtimeReports={airtimeReports} isLoading={loading === "reports"} />

      <section className="metrics-grid">
        <MetricCard icon={CalendarDays} label="Transactions" value={String(viewStats.totalCount)} />
        <MetricCard icon={CheckCircle2} label="Successful" value={String(viewStats.successCount)} tone="green" />
        <MetricCard icon={Gauge} label="Success rate" value={`${viewStats.successRate}%`} />
        {isAirtimeOnly
          ? <MetricCard icon={Phone} label="Failed" value={String(viewStats.failedCount)} tone="red" />
          : <MetricCard icon={ReceiptText} label="Revenue" value={formatMoney(viewStats.totalAmount)} />
        }
      </section>

      {!isAirtimeOnly && (
        <button
          type="button"
          className={`analytics-toggle${showAnalytics ? " analytics-toggle--open" : ""}`}
          onClick={() => setShowAnalytics((value) => !value)}
        >
          <ChartLine size={15} />
          {showAnalytics ? "Hide analytics" : "Show analytics"}
          <ChevronDown size={15} className="analytics-chevron" />
        </button>
      )}

      {showAnalytics && !isAirtimeOnly && (
        <>
          <div className="report-chart-grid">
            <Section title="Money over time" icon={TrendingUp}>
              <LineChart rows={stats.dailyTotals} />
            </Section>
            <Section title="Transaction results" icon={Gauge}>
              <StatusMix stats={viewStats} />
            </Section>
          </div>

          <Section title="Quick summary" icon={FileSearch}>
            <SummaryList stats={viewStats} />
          </Section>

          {service === "all" && (
            <Section title="Electricity vs airtime — transactions by day" icon={GitCompare}>
              <ServiceCompareChart electricityDays={stats.dailyTotals} airtimeRows={airtimeReports?.data || []} />
            </Section>
          )}

          <PlainInsights stats={viewStats} />
        </>
      )}

      <ReportFilters filters={filters} setFilters={setFilters} updateForm={updateForm} loading={loading} onSubmit={onSubmit} onClear={onClear} onPreset={onPreset} />

      <Section title="Transactions in this report" icon={FileSearch}>
        <TransactionTable rows={rows} reports={reports} loading={loading} onSelectRow={onSelectRow} />
        <Pagination meta={meta} loading={loading} onPage={onPage} />
      </Section>
    </div>
  );
}
