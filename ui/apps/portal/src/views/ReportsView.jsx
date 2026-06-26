import { useMemo, useState } from "react";
import {
  CalendarDays,
  FileDown,
  FileSearch,
  FileSpreadsheet,
  FileText,
  Gauge,
  GitCompare,
  ReceiptText,
  RefreshCw,
  TrendingUp,
  XCircle
} from "lucide-react";

import { Button, MetricCard, Section } from "@blueprint/ui";
import ReportFilters from "../components/transactions/ReportFilters";
import TransactionTable from "../components/transactions/TransactionTable";
import Pagination from "../components/transactions/Pagination";
import LineChart from "../components/common/LineChart";
import StatusMix from "../components/common/StatusMix";
import SummaryList from "../components/reports/SummaryList";
import ServiceCompareChart from "../components/reports/ServiceCompareChart";
import ServiceRaceCard from "../components/reports/ServiceRaceCard";
import { formatMoney, toNumber } from "../utils/formatters";

const EMPTY_STATS = {
  totalCount: 0,
  successCount: 0,
  failedCount: 0,
  totalAmount: 0,
  successRate: 0,
  receiptCount: 0,
  dailyTotals: [],
  topMeters: [],
  insights: []
};

const REPORT_TABS = [
  {
    key: "log",
    label: "Transaction Log",
    icon: FileText,
    tone: "blue"
  },
  {
    key: "failures",
    label: "Failures",
    icon: XCircle,
    tone: "pink"
  },
  {
    key: "daily",
    label: "Daily Totals",
    icon: CalendarDays,
    tone: "green"
  },
  {
    key: "trends",
    label: "Trends",
    icon: TrendingUp,
    tone: "yellow"
  },
  {
    key: "mix",
    label: "Service Mix",
    icon: GitCompare,
    tone: "cyan"
  }
];

const RANGES = [
  ["all", "All time"],
  ["today", "Today"],
  ["7d", "Last 7 days"],
  ["30d", "Last 30 days"]
];

function getRowStatus(row) {
  return String(
    row?.status ||
    row?.result ||
    row?.transaction_status ||
    row?.transactionStatus ||
    row?.response_status ||
    row?.responseStatus ||
    row?.state ||
    row?.resultCode ||
    ""
  )
    .trim()
    .toUpperCase();
}

function isSuccessfulRow(row) {
  const status = getRowStatus(row);

  return [
    "SUCCESS",
    "SUCCESSFUL",
    "COMPLETED",
    "COMPLETE",
    "APPROVED",
    "PAID"
  ].includes(status);
}

function isFailedRow(row) {
  const status = getRowStatus(row);

  return [
    "FAIL",
    "FAILED",
    "FAILURE",
    "ERROR",
    "DECLINED",
    "REJECTED",
    "UNSUCCESSFUL",
    "CANCELLED",
    "CANCELED",
    "TIMEOUT",
    "TIMED_OUT",
    "REVERSED"
  ].some((word) => status.includes(word));
}

function rowAmount(rows = []) {
  return rows.reduce((total, row) => total + toNumber(row?.amount), 0);
}

function extractReportRows(payload) {
  if (!payload) return [];

  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.rows)) return payload.rows;
  if (Array.isArray(payload.transactions)) return payload.transactions;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.records)) return payload.records;

  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.transactions)) return payload.data.transactions;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  if (Array.isArray(payload?.data?.records)) return payload.data.records;

  return [];
}

function rowIdentity(row, index) {
  return (
    row?.transaction_id ||
    row?.transactionId ||
    row?.id ||
    row?._id ||
    row?.reference ||
    row?._reference ||
    row?.meter_number ||
    row?.phonenumber ||
    `${row?.created_at || "date"}-${row?.amount || "amount"}-${index}`
  );
}

function uniqueRows(rows = []) {
  const seen = new Set();

  return rows.filter((row, index) => {
    const key = rowIdentity(row, index);

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function buildFailureRows(rows = [], reports, airtimeReports) {
  return uniqueRows([
    ...rows,
    ...extractReportRows(reports),
    ...extractReportRows(airtimeReports)
  ]).filter(isFailedRow);
}

function buildReportStats(rows = [], reportStats = EMPTY_STATS, meta) {
  const successRows = rows.filter(isSuccessfulRow);
  const failedRows = rows.filter(isFailedRow);

  const totalCount = Number(
    meta?.total ??
    reportStats?.totalCount ??
    rows.length ??
    0
  );

  const successCount = Number(
    reportStats?.successCount ??
    successRows.length ??
    0
  );

  const failedCount = Number(
    reportStats?.failedCount ??
    failedRows.length ??
    0
  );

  const totalAmount = Number(
    reportStats?.totalAmount ??
    rowAmount(successRows) ??
    0
  );

  const failedAmount = Number(
    reportStats?.failedAmount ??
    rowAmount(failedRows) ??
    0
  );

  const successRate = Number(
    reportStats?.successRate ??
    (totalCount ? Math.round((successCount / totalCount) * 100) : 0)
  );

  return {
    ...EMPTY_STATS,
    ...reportStats,
    totalCount,
    successCount,
    failedCount,
    totalAmount,
    failedAmount,
    successRate,
    averageAmount:
      reportStats?.averageAmount ??
      (successCount ? totalAmount / successCount : 0)
  };
}

function buildTabContext(tab, rows = [], reportStats = EMPTY_STATS, meta) {
  const failedRows = rows.filter(isFailedRow);
  const successRows = rows.filter(isSuccessfulRow);
  const fullStats = buildReportStats(rows, reportStats, meta);

  if (tab === "failures") {
    const loadedFailedAmount = rowAmount(failedRows);
    const failedAmount = fullStats.failedAmount || loadedFailedAmount;

    const stats = {
      ...fullStats,
      totalCount: fullStats.failedCount || failedRows.length,
      successCount: 0,
      failedCount: fullStats.failedCount || failedRows.length,
      totalAmount: failedAmount,
      failedAmount,
      averageAmount:
        fullStats.failedCount || failedRows.length
          ? failedAmount / (fullStats.failedCount || failedRows.length)
          : 0,
      successRate: 0
    };

    return {
      key: tab,
      rows: failedRows,
      stats,
      tableTitle: "Failed transactions",
      tableSubtitle:
        "Failed, declined, rejected, reversed, timeout, and error transactions",
      showPagination: false,
      metrics: {
        transactionDelta: "failed records",
        revenueLabel: "Failed value",
        revenueDelta: "amount at risk",
        successDelta: "0 successful in failure view",
        failedDelta: "need review"
      }
    };
  }

  if (tab === "daily") {
    return {
      key: tab,
      rows: successRows,
      stats: fullStats,
      tableTitle: "Daily successful transactions",
      tableSubtitle: "Rows included in the daily totals view",
      showPagination: false,
      metrics: {
        transactionDelta: "successful records",
        revenueLabel: "Sales value",
        revenueDelta: "successful sales",
        successDelta: `${fullStats.successCount}/${fullStats.totalCount} complete`,
        failedDelta: "excluded from this tab"
      }
    };
  }

  if (tab === "trends") {
    return {
      key: tab,
      rows,
      stats: fullStats,
      tableTitle: "Trend source transactions",
      tableSubtitle: "Rows feeding the trend and health charts",
      showPagination: false,
      metrics: {
        transactionDelta: "records in trend context",
        revenueLabel: "Revenue",
        revenueDelta: "successful sales",
        successDelta: `${fullStats.successCount}/${fullStats.totalCount} complete`,
        failedDelta: "need review"
      }
    };
  }

  if (tab === "mix") {
    return {
      key: tab,
      rows,
      stats: fullStats,
      tableTitle: "Service mix transactions",
      tableSubtitle: "Rows feeding the electricity and airtime mix",
      showPagination: false,
      metrics: {
        transactionDelta: "records in service mix",
        revenueLabel: "Revenue",
        revenueDelta: "successful sales",
        successDelta: `${fullStats.successCount}/${fullStats.totalCount} complete`,
        failedDelta: "need review"
      }
    };
  }

  return {
    key: "log",
    rows,
    stats: fullStats,
    tableTitle: "Transaction log",
    tableSubtitle: "All matching electricity and airtime records",
    showPagination: true,
    metrics: {
      transactionDelta: "records in this report",
      revenueLabel: "Revenue",
      revenueDelta: "successful sales",
      successDelta: `${fullStats.successCount}/${fullStats.totalCount} complete`,
      failedDelta: "need review"
    }
  };
}

function downloadCsv(rows = []) {
  const headers = [
    "Transaction ID",
    "Type",
    "Amount",
    "Meter / Phone",
    "Product",
    "Merchant",
    "Result",
    "Date"
  ];

  const esc = (value) => {
    const text = value == null ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const lines = [headers.join(",")];

  rows.forEach((row) => {
    lines.push(
      [
        row.transaction_id || row.transactionId,
        row._type || row.type || "electricity",
        row.amount,
        row._reference || row.reference || row.meter_number || row.phonenumber,
        row._detail || row.product_name || row.productName,
        row.merchant_name || row.merchant?.name,
        getRowStatus(row) || row.status,
        row.created_at || row.createdAt
      ]
        .map(esc)
        .join(",")
    );
  });

  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

export default function ReportsView({
  filters,
  setFilters,
  updateForm,
  loading,
  onSubmit,
  onClear,
  onPreset,
  onRefresh,
  onExport,
  stats = EMPTY_STATS,
  rows = [],
  reports,
  meta,
  onSelectRow,
  onPage,
  airtimeReports,
  serviceFilter = ""
}) {
  const [tab, setTab] = useState("log");
  const [range, setRange] = useState("all");

  const failureRows = useMemo(
    () => buildFailureRows(rows, reports, airtimeReports),
    [rows, reports, airtimeReports]
  );

  const contextRows = tab === "failures" ? failureRows : rows;

  const reportStatus =
    contextRows.length
      ? null
      : serviceFilter === "airtime"
        ? airtimeReports
        : reports;

  const activeContext = useMemo(
    () => buildTabContext(tab, contextRows, stats, meta),
    [tab, contextRows, stats, meta]
  );

  const activeStats = activeContext.stats;

  const activeTab =
    REPORT_TABS.find((item) => item.key === tab) || REPORT_TABS[0];

  const activeTableMeta = activeContext.showPagination ? meta : null;
  const activeReportStatus = activeContext.key === "log" ? reportStatus : null;

  function changeRange(value) {
    setRange(value);

    if (typeof onPreset === "function") {
      onPreset(value);
    }
  }

  function handleTabKeyDown(event, currentIndex) {
    const lastIndex = REPORT_TABS.length - 1;
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") {
      nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
    }

    if (event.key === "ArrowLeft") {
      nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
    }

    if (event.key === "Home") {
      nextIndex = 0;
    }

    if (event.key === "End") {
      nextIndex = lastIndex;
    }

    if (nextIndex !== currentIndex) {
      event.preventDefault();
      setTab(REPORT_TABS[nextIndex].key);
    }
  }

  return (
    <div className="view-stack">
      <div className="report-toolbar">
        <div className="report-toolbar__lead">
          <CalendarDays size={16} aria-hidden="true" />

          <select
            className="filter-bar__select report-range-select"
            value={range}
            onChange={(event) => changeRange(event.target.value)}
            aria-label="Date range"
          >
            {RANGES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="report-toolbar__actions">
          <Button
            icon={RefreshCw}
            variant="ghost"
            loading={loading === "reports"}
            onClick={onRefresh}
          >
            Refresh
          </Button>

          <Button
            icon={FileDown}
            variant="ghost"
            onClick={() => downloadCsv(activeContext.rows)}
            disabled={!activeContext.rows.length}
          >
            CSV
          </Button>

          <Button
            icon={FileSpreadsheet}
            loading={loading === "export"}
            onClick={onExport}
            disabled={!rows.length}
          >
            Excel
          </Button>
        </div>
      </div>

      <div className="report-tab-shell">
        <div className="report-tab-list" role="tablist" aria-label="Report tabs">
          {REPORT_TABS.map(({ key, label, icon: Icon, tone }, index) => {
            const isActive = tab === key;
            const tabId = `reports-tab-${key}`;
            const panelId = `reports-panel-${key}`;

            return (
              <button
                key={key}
                id={tabId}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={panelId}
                tabIndex={isActive ? 0 : -1}
                className={`report-tab-button ${isActive ? "active" : ""}`}
                onClick={() => setTab(key)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                <span
                  className={`report-tab-icon tone-${tone}`}
                  aria-hidden="true"
                >
                  <Icon size={15} strokeWidth={2.2} />
                </span>

                <span className="report-tab-label">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ReportFilters
        filters={filters}
        setFilters={setFilters}
        updateForm={updateForm}
        loading={loading}
        onSubmit={onSubmit}
        onClear={onClear}
        resultCount={activeContext.rows.length}
        totalCount={activeStats.totalCount}
      />

      <section className="metrics-grid">
        <MetricCard
          icon={CalendarDays}
          label="Transactions"
          value={String(activeStats.totalCount)}
          delta={activeContext.metrics.transactionDelta}
        />

        <MetricCard
          icon={ReceiptText}
          label={activeContext.metrics.revenueLabel}
          value={formatMoney(activeStats.totalAmount)}
          delta={activeContext.metrics.revenueDelta}
        />

        <MetricCard
          icon={Gauge}
          label="Success rate"
          value={`${activeStats.successRate}%`}
          delta={activeContext.metrics.successDelta}
        />

        <MetricCard
          icon={XCircle}
          label="Failed"
          value={String(activeStats.failedCount)}
          tone="red"
          delta={activeContext.metrics.failedDelta}
        />
      </section>

      <div
        id={`reports-panel-${activeTab.key}`}
        className="report-tab-panel"
        role="tabpanel"
        aria-labelledby={`reports-tab-${activeTab.key}`}
      >
        {tab === "daily" && (
          <>
            <Section title="Money over time" icon={TrendingUp}>
              <LineChart rows={activeStats.dailyTotals || []} />
            </Section>

            <Section title="Daily totals summary" icon={FileSearch}>
              <SummaryList stats={activeStats} />
            </Section>
          </>
        )}

        {tab === "trends" && (
          <div className="report-chart-grid">
            <Section
              title="Electricity and airtime over days"
              subtitle="Daily transaction volume by service"
              icon={GitCompare}
            >
              <ServiceCompareChart
                electricityDays={
                  serviceFilter === "airtime" ? [] : stats?.dailyTotals || []
                }
                airtimeRows={
                  serviceFilter === "electricity" ? [] : airtimeReports?.data || []
                }
              />
            </Section>

            <Section title="Transaction results" icon={Gauge}>
              <StatusMix stats={activeStats} />
            </Section>
          </div>
        )}

        {tab === "mix" && (
          <ServiceRaceCard
            stats={serviceFilter === "airtime" ? EMPTY_STATS : stats}
            airtimeReports={
              serviceFilter === "electricity" ? null : airtimeReports
            }
            isLoading={loading === "reports"}
          />
        )}

        <Section
          title={activeContext.tableTitle}
          subtitle={activeContext.tableSubtitle}
          icon={activeTab.icon}
        >
          <TransactionTable
            rows={activeContext.rows}
            reports={activeReportStatus}
            loading={loading}
            onSelectRow={onSelectRow}
            meta={activeTableMeta}
          />

          {activeContext.showPagination ? (
            <Pagination meta={meta} loading={loading} onPage={onPage} />
          ) : null}
        </Section>
      </div>
    </div>
  );
}