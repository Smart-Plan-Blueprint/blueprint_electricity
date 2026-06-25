import { useState } from "react";
import { CalendarDays, FileDown, FileSearch, FileSpreadsheet, FileText, Gauge, GitCompare, ReceiptText, RefreshCw, TrendingUp, XCircle } from "lucide-react";
import { Button, MetricCard, Section } from "@blueprint/ui";
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

const REPORT_TABS = [
  { key: "log", label: "Transaction Log", icon: FileText },
  { key: "failures", label: "Failures", icon: XCircle },
  { key: "daily", label: "Daily Totals", icon: CalendarDays },
  { key: "trends", label: "Trends", icon: TrendingUp },
  { key: "mix", label: "Service Mix", icon: GitCompare }
];

const RANGES = [
  ["all", "All time"],
  ["today", "Today"],
  ["7d", "Last 7 days"],
  ["30d", "Last 30 days"]
];

function buildAirtimeStats(airtimeReports) {
  const summary = airtimeReports?.summary || {};
  const total = summary.total ?? 0;
  const success = summary.successful ?? 0;
  const failed = total - success;
  return {
    totalCount: total,
    successCount: success,
    failedCount: failed,
    totalAmount: 0,
    successRate: total ? Math.round((success / total) * 100) : 0,
    receiptCount: 0,
    dailyTotals: [],
    topMeters: [],
    insights: []
  };
}

function buildCombinedStats(elecStats, airtimeReports) {
  const airStats = buildAirtimeStats(airtimeReports);
  const total = elecStats.totalCount + airStats.totalCount;
  const success = elecStats.successCount + airStats.successCount;
  return {
    ...elecStats,
    totalCount: total,
    successCount: success,
    failedCount: elecStats.failedCount + airStats.failedCount,
    successRate: total ? Math.round((success / total) * 100) : 0,
    receiptCount: elecStats.receiptCount
  };
}

function downloadCsv(rows) {
  const headers = ["Transaction ID", "Type", "Amount", "Meter / Phone", "Product", "Merchant", "Result", "Date"];
  const esc = (value) => {
    const text = value == null ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    lines.push([
      row.transaction_id,
      row._type || "electricity",
      row.amount,
      row._reference || row.meter_number,
      row._detail,
      row.merchant_name || row.merchant?.name,
      row.status,
      row.created_at
    ].map(esc).join(","));
  });
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportsView({ filters, setFilters, updateForm, loading, onSubmit, onClear, onPreset, onRefresh, onExport, stats, rows, reports, meta, onSelectRow, onPage, airtimeReports }) {
  const [tab, setTab] = useState("log");
  const [range, setRange] = useState("all");

  const viewStats = buildCombinedStats(stats, airtimeReports);
  const totalCount = meta?.total ?? viewStats.totalCount;
  const failedRows = rows.filter((row) => String(row.status || "").toUpperCase().includes("FAIL"));

  function changeRange(value) {
    setRange(value);
    onPreset(value);
  }

  return (
    <div className="view-stack">
      {/* Toolbar — date range + export actions */}
      <div className="report-toolbar">
        <div className="report-toolbar__lead">
          <CalendarDays size={16} />
          <select
            className="filter-bar__select"
            value={range}
            onChange={(event) => changeRange(event.target.value)}
            aria-label="Date range"
          >
            {RANGES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="report-toolbar__actions">
          <Button icon={RefreshCw} variant="ghost" loading={loading === "reports"} onClick={onRefresh}>Refresh</Button>
          <Button icon={FileDown} variant="ghost" onClick={() => downloadCsv(rows)} disabled={!rows.length}>CSV</Button>
          <Button icon={FileSpreadsheet} loading={loading === "export"} onClick={onExport} disabled={!rows.length}>Excel</Button>
        </div>
      </div>

      {/* Report-type tabs */}
      <div className="service-tabs">
        {REPORT_TABS.map(({ key, label, icon: Icon }) => (
          <button
            type="button"
            key={key}
            className={`service-tab${tab === key ? " service-tab--active" : ""}`}
            onClick={() => setTab(key)}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Horizontal filter bar */}
      <ReportFilters
        filters={filters}
        setFilters={setFilters}
        updateForm={updateForm}
        loading={loading}
        onSubmit={onSubmit}
        onClear={onClear}
        resultCount={rows.length}
        totalCount={totalCount}
      />

      {/* KPI cards */}
      <section className="metrics-grid">
        <MetricCard icon={CalendarDays} label="Transactions" value={String(viewStats.totalCount)} delta="records in this report" />
        <MetricCard icon={ReceiptText} label="Revenue" value={formatMoney(viewStats.totalAmount)} delta="successful sales" />
        <MetricCard icon={Gauge} label="Success rate" value={`${viewStats.successRate}%`} delta={`${viewStats.successCount}/${viewStats.totalCount} complete`} />
        <MetricCard icon={XCircle} label="Failed" value={String(viewStats.failedCount)} tone="red" delta="need review" />
      </section>

      {/* Tab content */}
      {tab === "log" && (
        <Section title="Transaction log" icon={FileText}>
          <TransactionTable rows={rows} reports={reports} loading={loading} onSelectRow={onSelectRow} />
          <Pagination meta={meta} loading={loading} onPage={onPage} />
        </Section>
      )}

      {tab === "failures" && (
        <Section title="Failed transactions" icon={XCircle}>
          <TransactionTable rows={failedRows} reports={reports} loading={loading} onSelectRow={onSelectRow} />
        </Section>
      )}

      {tab === "daily" && (
        <>
          <Section title="Money over time" icon={TrendingUp}>
            <LineChart rows={stats.dailyTotals} />
          </Section>
          <Section title="Daily totals summary" icon={FileSearch}>
            <SummaryList stats={viewStats} />
          </Section>
        </>
      )}

      {tab === "trends" && (
        <div className="report-chart-grid">
          <Section title="Electricity vs airtime" icon={GitCompare}>
            <ServiceCompareChart electricityDays={stats.dailyTotals} airtimeRows={airtimeReports?.data || []} />
          </Section>
          <Section title="Transaction results" icon={Gauge}>
            <StatusMix stats={viewStats} />
          </Section>
        </div>
      )}

      {tab === "mix" && (
        <>
          <ServiceRaceCard stats={stats} airtimeReports={airtimeReports} isLoading={loading === "reports"} />
          <PlainInsights stats={viewStats} />
        </>
      )}
    </div>
  );
}
