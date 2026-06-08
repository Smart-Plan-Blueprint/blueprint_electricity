import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileSearch,
  Gauge,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  PlugZap,
  ReceiptText,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  TrendingUp,
  X,
  XCircle
} from "lucide-react";
import { Button, Field, MetricCard, Section, StatusBadge } from "@blueprint/ui";
import { createElectricityClient } from "@blueprint/api-client";
import { createDemoReport } from "./demoData";
import { createTransactionReportWorkbook, reportWorkbookFileName } from "./xlsxReport";

const defaultBaseUrl = "";
const demoMode = import.meta.env.VITE_DEMO_MODE === "true";
const defaultApiToken = demoMode ? "smart-plan-blueprint-demo" : import.meta.env.VITE_API_TOKEN || "";
const sessionKey = "blueprint-electricity-session";

const initialFilters = {
  status: "",
  transaction_id: "",
  meter_number: "",
  search: "",
  from: "",
  to: "",
  per_page: "50",
  page: "1"
};

const filtersKey = "blueprint-electricity-filters";
const autoRefreshMs = 30000;
const defaultReportSettings = {
  enabled: false,
  recipients: [],
  timezone: "Africa/Gaborone",
  send_time: "02:00"
};

function App() {
  const [session, setSession] = useStoredSession();
  const [apiToken, setApiToken] = useState(session?.apiToken || defaultApiToken);
  const [activeView, setActiveView] = useState("dashboard");
  const [loginError, setLoginError] = useState("");
  const [filters, setFilters] = useState(loadStoredFilters);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState("");
  const [range, setRange] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [selected, setSelected] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [search, setSearch] = useState(filters.search || "");
  const [reportSettings, setReportSettings] = useState(defaultReportSettings);
  const [recipientDraft, setRecipientDraft] = useState("");

  const reportsRef = useRef(reports);
  reportsRef.current = reports;
  const searchInputRef = useRef(null);

  const client = useMemo(() => createElectricityClient({ baseUrl: defaultBaseUrl, apiToken }), [apiToken]);
  const isAuthenticated = Boolean(session?.apiToken);
  const rows = reports?.data || [];
  const stats = useMemo(() => normalizeStats(reports, rows), [reports, rows]);
  const meta = reports?.meta || null;

  useEffect(() => {
    if (isAuthenticated) {
      loadReports();
      loadReportSettings();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) {
      return undefined;
    }

    const timer = setInterval(() => loadReports(), autoRefreshMs);
    return () => clearInterval(timer);
  }, [isAuthenticated, autoRefresh, filters]);

  useEffect(() => {
    try {
      localStorage.setItem(filtersKey, JSON.stringify(filters));
    } catch {
      // Ignore storage failures.
    }
  }, [filters]);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    function onKey(event) {
      if (event.target.matches?.("input, select, textarea")) {
        return;
      }
      if (event.key === "r") {
        event.preventDefault();
        loadReports();
      }
      if (event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isAuthenticated, filters]);

  function pushToast(tone, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, tone, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }

  function dismissToast(id) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function updateForm(setter, field, value) {
    setter((current) => ({ ...current, [field]: value }));
  }

  async function runAction(name, action, onSuccess, onError) {
    setLoading(name);

    try {
      const result = await action();
      onSuccess?.(result);
      return result;
    } catch (error) {
      const payload = {
        results: "FAILED",
        message: error.message,
        details: null
      };
      onError?.(payload);
      return payload;
    } finally {
      setLoading("");
    }
  }

  function startSession(token, source = demoMode ? "Demo data" : "Live data") {
    const nextSession = {
      apiToken: token,
      baseUrl: defaultBaseUrl,
      source,
      signedInAt: new Date().toISOString()
    };

    setApiToken(token);
    setSession(nextSession);
    setLoginError("");
    setActiveView("dashboard");
  }

  async function handleTokenLogin(event) {
    event.preventDefault();
    setLoginError("");

    if (!apiToken.trim()) {
      setLoginError("Paste your access code to continue.");
      return;
    }

    await runAction(
      "login",
      () => demoMode ? Promise.resolve(createDemoReport({ per_page: 1 })) : createElectricityClient({ baseUrl: defaultBaseUrl, apiToken: apiToken.trim() }).transactionLogs({ per_page: 1 }),
      () => startSession(apiToken.trim(), demoMode ? "Demo data" : "Live data"),
      (result) => setLoginError(result.message)
    );
  }

  function handleLogout() {
    setSession(null);
    setApiToken("");
    setReports(null);
    setActiveView("dashboard");
  }

  async function loadReports(nextFilters = filters) {
    setLoading("reports");

    try {
      const result = demoMode ? createDemoReport(nextFilters) : await client.transactionLogs(nextFilters);
      setReports(result);
      setUpdatedAt(new Date());
    } catch (error) {
      if (reportsRef.current?.data?.length) {
        pushToast("error", `Could not refresh: ${error.message}`);
      } else {
        setReports({ results: "FAILED", message: error.message });
      }
    } finally {
      setLoading("");
    }
  }

  async function loadReportSettings() {
    try {
      const result = demoMode ? { results: "SUCCESS", data: defaultReportSettings } : await client.reportSettings();
      setReportSettings({ ...defaultReportSettings, ...(result.data || {}) });
    } catch (error) {
      pushToast("error", `Could not load email settings: ${error.message}`);
    }
  }

  function addRecipient(event) {
    event.preventDefault();
    const email = recipientDraft.trim().toLowerCase();

    if (!email) {
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      pushToast("error", "Enter a valid email address.");
      return;
    }

    setReportSettings((current) => ({
      ...current,
      recipients: [...new Set([...(current.recipients || []), email])]
    }));
    setRecipientDraft("");
  }

  function removeRecipient(email) {
    setReportSettings((current) => ({
      ...current,
      recipients: (current.recipients || []).filter((recipient) => recipient !== email)
    }));
  }

  async function saveReportSettings() {
    await runAction(
      "save-report-settings",
      () => demoMode
        ? Promise.resolve({ results: "SUCCESS", data: reportSettings })
        : client.updateReportSettings({
            ...reportSettings,
            timezone: "Africa/Gaborone",
            send_time: "02:00"
          }),
      (result) => {
        setReportSettings({ ...defaultReportSettings, ...(result.data || reportSettings) });
        pushToast("success", "Daily email settings saved.");
      },
      (result) => pushToast("error", result.message || "Could not save email settings.")
    );
  }

  async function sendTestReport() {
    await runAction(
      "send-test-report",
      () => demoMode
        ? Promise.resolve({ results: "SUCCESS", message: "Demo test email simulated." })
        : client.sendTestReport(),
      (result) => pushToast("success", result.message || "Test report email sent."),
      (result) => pushToast("error", result.message || "Could not send the test email.")
    );
  }

  function applyFilters(nextFilters) {
    const merged = { ...filters, ...nextFilters, page: "1" };
    setFilters(merged);
    loadReports(merged);
  }

  function clearFilters() {
    const next = { ...initialFilters };
    setSearch("");
    setRange("all");
    setFilters(next);
    loadReports(next);
  }

  function applyPreset(preset) {
    const next = presetFilters(preset);
    setSearch("");
    setRange(next.range || "all");
    delete next.range;
    const merged = { ...initialFilters, ...next, page: "1" };
    setFilters(merged);
    loadReports(merged);
  }

  function handleFilterSubmit(event) {
    event.preventDefault();
    applyFilters({});
  }

  function goToPage(page) {
    const merged = { ...filters, page: String(page) };
    setFilters(merged);
    loadReports(merged);
  }

  function selectRange(nextRange) {
    setRange(nextRange);
    const { from, to } = rangeBounds(nextRange);
    applyFilters({ from, to });
  }

  function filterByStatus(status) {
    setActiveView("transactions");
    applyFilters({ status });
  }

  function runSearch(event) {
    event.preventDefault();
    applyFilters({ search: search.trim() });
  }

  async function exportReport() {
    setLoading("export");

    try {
      const blob = createTransactionReportWorkbook(rows, filters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = reportWorkbookFileName(filters);
      link.click();
      URL.revokeObjectURL(url);
      pushToast("success", "Downloaded the Excel report.");
    } catch (error) {
      pushToast("error", `Could not download report: ${error.message}`);
    } finally {
      setLoading("");
    }
  }

  if (!isAuthenticated) {
    return (
      <AuthScreen
        apiToken={apiToken}
        loginError={loginError}
        loading={loading}
        setApiToken={setApiToken}
        onTokenLogin={handleTokenLogin}
      />
    );
  }

  return (
    <main className="portal-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><PlugZap size={22} /></div>
          <div>
            <strong>Smart Plan Blueprint</strong>
            <span>Reporting Portal</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          <NavButton active={activeView === "dashboard"} icon={LayoutDashboard} onClick={() => setActiveView("dashboard")}>Dashboard</NavButton>
          <NavButton active={activeView === "reports"} icon={BarChart3} onClick={() => setActiveView("reports")}>Reports</NavButton>
          <NavButton active={activeView === "transactions"} icon={FileSearch} onClick={() => setActiveView("transactions")}>Transactions</NavButton>
          <NavButton active={activeView === "email"} icon={Mail} onClick={() => setActiveView("email")}>Email Reports</NavButton>
        </nav>

        <div className="session-card">
          <StatusBadge status={demoMode ? "DEMO DATA" : "LIVE DATA"} />
          <span>{session.source}</span>
          <button type="button" onClick={handleLogout}>
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      <section className="portal-main">
        <header className="portal-header">
          <div>
            <p className="eyebrow">Overview</p>
            <h1>{viewTitle(activeView)}</h1>
            <p className="page-help">{viewHelp(activeView)}</p>
            <LastUpdated updatedAt={updatedAt} loading={loading === "reports"} />
          </div>
          <div className="header-actions">
            <form className="header-search" onSubmit={runSearch}>
              <Search size={16} />
              <input
                ref={searchInputRef}
                value={search}
                placeholder="Search transaction, meter, customer, or merchant..."
                onChange={(event) => setSearch(event.target.value)}
              />
            </form>
            <AutoRefreshToggle enabled={autoRefresh} onToggle={() => setAutoRefresh((value) => !value)} />
            <Button icon={RefreshCw} loading={loading === "reports"} onClick={() => loadReports()}>Refresh</Button>
            <Button icon={ArrowDownToLine} loading={loading === "export"} onClick={exportReport} disabled={!rows.length}>Download Excel</Button>
          </div>
        </header>

        {activeView === "dashboard" && (
          <DashboardView
            stats={stats}
            rows={rows}
            reports={reports}
            meta={meta}
            loading={loading}
            range={range}
            onSelectRange={selectRange}
            onRefresh={() => loadReports()}
            onStatusFilter={filterByStatus}
            onSelectRow={setSelected}
            onPage={goToPage}
          />
        )}

        {activeView === "reports" && (
          <ReportsView
            filters={filters}
            setFilters={setFilters}
            updateForm={updateForm}
            loading={loading}
            onSubmit={handleFilterSubmit}
            onClear={clearFilters}
            onPreset={applyPreset}
            stats={stats}
            rows={rows}
            reports={reports}
            meta={meta}
            onExport={exportReport}
            onSelectRow={setSelected}
            onPage={goToPage}
          />
        )}

        {activeView === "transactions" && (
          <TransactionsView
            filters={filters}
            setFilters={setFilters}
            updateForm={updateForm}
            loading={loading}
            onSubmit={handleFilterSubmit}
            onClear={clearFilters}
            onPreset={applyPreset}
            rows={rows}
            reports={reports}
            meta={meta}
            onSelectRow={setSelected}
            onPage={goToPage}
          />
        )}

        {activeView === "email" && (
          <EmailReportsView
            settings={reportSettings}
            recipientDraft={recipientDraft}
            loading={loading}
            onChange={setReportSettings}
            onRecipientDraft={setRecipientDraft}
            onAddRecipient={addRecipient}
            onRemoveRecipient={removeRecipient}
            onSave={saveReportSettings}
            onSendTest={sendTestReport}
          />
        )}

      </section>

      {selected ? <TransactionDrawer row={selected} onClose={() => setSelected(null)} /> : null}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}

function AuthScreen({
  apiToken,
  loginError,
  loading,
  setApiToken,
  onTokenLogin
}) {
  return (
    <main className="auth-layout">
      <section className="auth-panel">
        <div className="brand-lockup auth-brand">
            <div className="brand-mark"><PlugZap size={24} /></div>
          <div>
            <strong>Smart Plan Blueprint</strong>
            <span>Reporting platform</span>
          </div>
        </div>
        <h1>Open your reports</h1>
        <p>
          See electricity transactions, successful payments, problem payments, and meter activity in one place.
        </p>

        <div className="auth-metrics">
          <MetricCard icon={ShieldCheck} label="Access" value="Secure code" />
          <MetricCard icon={BarChart3} label="Reports" value="Transaction data" />
        </div>
      </section>

      <section className="auth-card">
        <div>
          <p className="eyebrow">Secure access</p>
          <h2>Enter access code</h2>
        </div>

        <form className="form-stack" onSubmit={onTokenLogin}>
          <Field
            label={demoMode ? "Demo access code" : "Access code"}
            value={apiToken}
            onChange={(event) => setApiToken(event.target.value)}
            placeholder="Paste your access code"
            required
          />
          <Button icon={LockKeyhole} loading={loading === "login"}>Open dashboard</Button>
        </form>

        {loginError ? <div className="error-banner">{loginError}</div> : null}
      </section>
    </main>
  );
}

function DashboardView({ stats, rows, reports, meta, loading, range, onSelectRange, onRefresh, onStatusFilter, onSelectRow, onPage }) {
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

function ReportsView({ filters, setFilters, updateForm, loading, onSubmit, onClear, onPreset, stats, rows, reports, meta, onExport, onSelectRow, onPage }) {
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

function TransactionsView({ filters, setFilters, updateForm, loading, onSubmit, onClear, onPreset, rows, reports, meta, onSelectRow, onPage }) {
  return (
    <div className="view-stack">
      <ReportFilters filters={filters} setFilters={setFilters} updateForm={updateForm} loading={loading} onSubmit={onSubmit} onClear={onClear} onPreset={onPreset} />
      <Section title="Transactions" icon={ReceiptText}>
        <TransactionTable rows={rows} reports={reports} loading={loading} onSelectRow={onSelectRow} />
        <Pagination meta={meta} loading={loading} onPage={onPage} />
      </Section>
    </div>
  );
}

function EmailReportsView({
  settings,
  recipientDraft,
  loading,
  onChange,
  onRecipientDraft,
  onAddRecipient,
  onRemoveRecipient,
  onSave,
  onSendTest
}) {
  const recipients = settings.recipients || [];
  const enabled = Boolean(settings.enabled);

  return (
    <div className="view-stack">
      <section className="email-hero">
        <div>
          <p className="eyebrow">Automatic emails</p>
          <h2>Daily report at 2:00 AM</h2>
          <p>Smart Plan Blueprint will send yesterday&apos;s real transaction report every morning.</p>
        </div>
        <div className="email-status-card">
          <StatusBadge status={enabled ? "READY" : "DISABLED"} />
          <strong>{enabled ? "Daily email is on" : "Daily email is off"}</strong>
          <span>{recipients.length} recipient{recipients.length === 1 ? "" : "s"} selected</span>
        </div>
      </section>

      <div className="email-settings-grid">
        <Section title="Schedule" icon={Clock3}>
          <div className="schedule-card">
            <label className="switch-row">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(event) => onChange((current) => ({ ...current, enabled: event.target.checked }))}
              />
              <span>
                <strong>Send daily report emails</strong>
                <em>When this is on, Laravel sends the report automatically.</em>
              </span>
            </label>
            <dl className="schedule-list">
              <div><dt>Send time</dt><dd>2:00 AM</dd></div>
              <div><dt>Timezone</dt><dd>Africa/Gaborone</dd></div>
              <div><dt>Report range</dt><dd>Yesterday, midnight to 11:59 PM</dd></div>
            </dl>
          </div>
        </Section>

        <Section title="Recipients" icon={Mail}>
          <form className="recipient-form" onSubmit={onAddRecipient}>
            <Field
              label="Email address"
              type="email"
              value={recipientDraft}
              onChange={(event) => onRecipientDraft(event.target.value)}
              placeholder="name@company.com"
            />
            <Button icon={Mail}>Add</Button>
          </form>
          <div className="recipient-list" aria-label="Report recipients">
            {recipients.length ? recipients.map((email) => (
              <span className="recipient-chip" key={email}>
                {email}
                <button type="button" onClick={() => onRemoveRecipient(email)} aria-label={`Remove ${email}`}>
                  <X size={13} />
                </button>
              </span>
            )) : <div className="empty-state">Add at least one email address before enabling daily sends.</div>}
          </div>
        </Section>
      </div>

      <Section title="Send and save" icon={Send}>
        <div className="email-actions-panel">
          <div>
            <strong>Ready to use</strong>
            <span>The email includes a summary and an Excel workbook with Transactions, Successful, Failed, and Summary sheets.</span>
          </div>
          <div className="section-actions">
            <Button icon={Send} loading={loading === "send-test-report"} disabled={!recipients.length} onClick={onSendTest}>Send test</Button>
            <Button icon={Save} loading={loading === "save-report-settings"} onClick={onSave}>Save settings</Button>
          </div>
        </div>
      </Section>
    </div>
  );
}

function ReportFilters({ filters, setFilters, updateForm, loading, onSubmit, onClear, onPreset }) {
  return (
    <Section title="Find transactions" icon={FileSearch}>
      <div className="preset-row" aria-label="Quick report choices">
        <button type="button" onClick={() => onPreset("today")}>Today</button>
        <button type="button" onClick={() => onPreset("yesterday")}>Yesterday</button>
        <button type="button" onClick={() => onPreset("7d")}>Last 7 days</button>
        <button type="button" onClick={() => onPreset("success")}>Successful only</button>
        <button type="button" onClick={() => onPreset("failed")}>Failed only</button>
      </div>
      <form className="report-filters" onSubmit={onSubmit}>
        <Field label="Start date" type="date" value={filters.from} onChange={(event) => updateForm(setFilters, "from", event.target.value)} />
        <Field label="End date" type="date" value={filters.to} onChange={(event) => updateForm(setFilters, "to", event.target.value)} />
        <label className="field">
          <span>Result</span>
          <select value={filters.status} onChange={(event) => updateForm(setFilters, "status", event.target.value)}>
            <option value="">All results</option>
            <option value="SUCCESS">Successful</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
            <option value="UNKNOWN">Other</option>
          </select>
        </label>
        <Field label="Transaction" value={filters.transaction_id} onChange={(event) => updateForm(setFilters, "transaction_id", event.target.value)} />
        <Field label="Meter" value={filters.meter_number} onChange={(event) => updateForm(setFilters, "meter_number", event.target.value)} />
        <Field label="Rows per page" type="number" min="1" max="100" value={filters.per_page} onChange={(event) => updateForm(setFilters, "per_page", event.target.value)} />
        <div className="filter-actions">
          <Button icon={Search} loading={loading === "reports"}>Apply filters</Button>
          <button type="button" className="ghost-button" onClick={onClear}>Clear</button>
        </div>
      </form>
    </Section>
  );
}

function TransactionTable({ rows, reports, loading, onRefresh, onSelectRow, compact = false }) {
  const [sort, setSort] = useState({ key: "", dir: "asc" });

  const sortedRows = useMemo(() => sortRows(rows, sort), [rows, sort]);

  function toggleSort(key) {
    setSort((current) => {
      if (current.key !== key) {
        return { key, dir: "asc" };
      }
      return { key, dir: current.dir === "asc" ? "desc" : "asc" };
    });
  }

  if (loading === "reports" && !rows.length) {
    return <TableSkeleton compact={compact} />;
  }

  if (reports?.results === "FAILED") {
    return (
      <div className="error-banner">
        {reports.message || "Unable to load transactions."}
        {onRefresh ? <button type="button" onClick={onRefresh}>Retry</button> : null}
      </div>
    );
  }

  if (!rows.length) {
    return <div className="empty-state">No transactions match this view.</div>;
  }

  const columns = [
    { key: "transaction_id", label: "Transaction" },
    { key: "amount", label: "Amount", numeric: true },
    { key: "meter_number", label: "Meter" },
    { key: "merchant_name", label: "Merchant" },
    { key: "status", label: "Result" },
    { key: "created_at", label: "Date and time" },
    { key: "view", label: "" }
  ];

  return (
    <div className={`table-wrap ${compact ? "compact-table-wrap" : ""}`}>
      <table className={compact ? "compact-table" : ""}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>
                <button type="button" className="sort-head" onClick={() => toggleSort(column.key)}>
                  {column.label}
                  <SortIcon active={sort.key === column.key} dir={sort.dir} />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((item, index) => (
            <tr
              key={`${item.transaction_id || "row"}-${item.created_at || index}`}
              className="row-clickable"
              onClick={() => onSelectRow?.(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectRow?.(item);
                }
              }}
              tabIndex={0}
              aria-label={`View transaction ${item.transaction_id || index + 1}`}
            >
              <td>{item.transaction_id || "N/A"}</td>
              <td>{formatMoney(item.amount)}</td>
              <td>{item.meter_number || "N/A"}</td>
              <td>{item.merchant_name || item.merchant?.name || "Smart Plan Blueprint"}</td>
              <td><StatusBadge status={item.status || "UNKNOWN"} /></td>
              <td>{item.created_at || "N/A"}</td>
              <td>
                <button
                  type="button"
                  className="view-row-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectRow?.(item);
                  }}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({ meta, loading, onPage }) {
  if (!meta || meta.last_page <= 1) {
    return null;
  }

  const { current_page: current, last_page: last, total } = meta;
  const busy = loading === "reports";

  return (
    <div className="pagination">
      <span>Page {current} of {last} · {total} total</span>
      <div className="pagination-controls">
        <button type="button" disabled={busy || current <= 1} onClick={() => onPage(current - 1)}>
          <ChevronLeft size={16} />
          Prev
        </button>
        <button type="button" disabled={busy || current >= last} onClick={() => onPage(current + 1)}>
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function TransactionDrawer({ row, onClose }) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fields = [
    ["Transaction", row.transaction_id],
    ["Amount", formatMoney(row.amount)],
    ["Meter", row.meter_number],
    ["Merchant", row.merchant_name || row.merchant?.name || "Smart Plan Blueprint"],
    ["Result", row.status],
    ["Date and time", row.created_at],
    ["Customer", row.customer_name],
    ["Message", row.message]
  ];

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(event) => event.stopPropagation()}>
        <header className="drawer-header">
          <div>
            <p className="eyebrow">Transaction</p>
            <h2>{row.transaction_id || "N/A"}</h2>
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="drawer-status">
          <StatusBadge status={row.status || "UNKNOWN"} />
        </div>
        <dl className="drawer-list">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || "N/A"}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}

function TopMeters({ meters }) {
  if (!meters?.length) {
    return <div className="empty-state">No successful transactions to rank yet.</div>;
  }

  const max = Math.max(...meters.map((meter) => meter.amount), 1);

  return (
    <ol className="top-meters">
      {meters.map((meter, index) => (
        <li key={meter.meter_number}>
          <span className="top-rank">{index + 1}</span>
          <div className="top-body">
            <div className="top-line">
              <strong>{meter.meter_number}</strong>
              <span>{formatMoney(meter.amount)}</span>
            </div>
            <div className="top-bar">
              <i style={{ width: `${Math.max((meter.amount / max) * 100, 3)}%` }} />
            </div>
            <span className="top-meta">{meter.count} sale{meter.count === 1 ? "" : "s"}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) {
    return null;
  }

  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.tone}`} role="status">
          <span>{toast.message}</span>
          <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ compact }) {
  const cols = compact ? 6 : 7;
  return (
    <div className="table-wrap">
      <div className="skeleton-table">
        {Array.from({ length: 6 }).map((_, rowIndex) => (
          <div className="skeleton-row" key={rowIndex}>
            {Array.from({ length: cols }).map((__, cellIndex) => (
              <span className="skeleton-cell" key={cellIndex} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function RangePicker({ range, onSelectRange }) {
  const options = [
    ["today", "Today"],
    ["7d", "7 days"],
    ["30d", "30 days"],
    ["all", "All"]
  ];

  return (
    <div className="range-picker" role="group" aria-label="Date range">
      {options.map(([value, label]) => (
        <button
          key={value}
          type="button"
          className={range === value ? "active" : ""}
          onClick={() => onSelectRange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function AutoRefreshToggle({ enabled, onToggle }) {
  return (
    <button type="button" className={`auto-refresh ${enabled ? "on" : ""}`} onClick={onToggle}>
      <span className="auto-dot" />
      Auto refresh {enabled ? "on" : "off"}
    </button>
  );
}

function LastUpdated({ updatedAt, loading }) {
  if (!updatedAt) {
    return null;
  }

  return (
    <p className="last-updated">
      {loading ? "Refreshing..." : `Last updated ${updatedAt.toLocaleTimeString()}`}
    </p>
  );
}

function SortIcon({ active, dir }) {
  if (!active) {
    return <ArrowUpDown size={13} className="sort-icon" />;
  }
  return dir === "asc" ? <ArrowUp size={13} className="sort-icon" /> : <ArrowDown size={13} className="sort-icon" />;
}

function BarChart({ rows }) {
  const max = Math.max(...rows.map((row) => row.amount), 1);

  if (!rows.length) {
    return <div className="empty-state">No dated transactions to show yet.</div>;
  }

  return (
    <div className="bar-chart">
      {rows.map((row) => (
        <div className="bar-row" key={row.date}>
          <span>{row.date}</span>
          <div>
            <i style={{ width: `${Math.max((row.amount / max) * 100, 2)}%` }} />
          </div>
          <strong>{formatMoney(row.amount)}</strong>
        </div>
      ))}
    </div>
  );
}

function LineChart({ rows }) {
  if (!rows.length) {
    return <div className="empty-state">No dated transactions to show yet.</div>;
  }

  const width = 720;
  const height = 300;
  const padding = { top: 28, right: 28, bottom: 54, left: 58 };
  const values = rows.map((row) => Number(row.amount) || 0);
  const max = Math.max(...values, 1);
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const step = rows.length > 1 ? innerWidth / (rows.length - 1) : innerWidth;
  const points = rows.map((row, index) => {
    const x = padding.left + index * step;
    const y = padding.top + innerHeight - ((Number(row.amount) || 0) / max) * innerHeight;
    return { ...row, x, y };
  });
  const line = smoothPath(points);
  const area = `${line} L${padding.left + innerWidth},${padding.top + innerHeight} L${padding.left},${padding.top + innerHeight} Z`;
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((value) => ({
    y: padding.top + innerHeight - value * innerHeight,
    label: formatCompactMoney(max * value)
  }));

  return (
    <div className="line-chart-wrap">
      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Daily transaction amount line graph">
        <defs>
          <linearGradient id="reportLineFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2b6ce0" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#2b6ce0" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {gridLines.map((lineItem) => (
          <g key={lineItem.y}>
            <line className="line-chart-grid" x1={padding.left} x2={padding.left + innerWidth} y1={lineItem.y} y2={lineItem.y} />
            <text className="line-chart-label" x={padding.left - 10} y={lineItem.y + 4} textAnchor="end">{lineItem.label}</text>
          </g>
        ))}
        <path className="line-chart-area" d={area} />
        <path className="line-chart-glow" d={line} />
        <path className="line-chart-path" d={line} />
        {points.map((point) => (
          <g key={point.date}>
            <circle className="line-chart-dot-halo" cx={point.x} cy={point.y} r="9" />
            <circle className="line-chart-dot" cx={point.x} cy={point.y} r="4.8" />
            <text className="line-chart-date" x={point.x} y={height - 16} textAnchor="middle">{shortDate(point.date)}</text>
          </g>
        ))}
      </svg>
      <div className="line-chart-summary">
        <span>Peak day</span>
        <strong>{peakDay(rows)}</strong>
      </div>
    </div>
  );
}

function StatusMix({ stats, onStatusFilter }) {
  const items = [
    { tone: "success", label: "Success", count: stats.successCount, status: "SUCCESS" },
    { tone: "failed", label: "Failed", count: stats.failedCount, status: "FAILED" },
    { tone: "pending", label: "Pending / other", count: stats.pendingCount, status: "PENDING" }
  ];

  return (
    <div className="status-mix">
      <div style={{ "--value": `${stats.successRate}%` }}>
        <strong>{stats.successRate}%</strong>
        <span>successful</span>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.tone}>
            <button type="button" onClick={() => onStatusFilter?.(item.status)}>
              <span className={`dot ${item.tone}`} />
              <span className="status-label">{item.label}</span>
              <span className="status-count">{item.count}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SummaryList({ stats }) {
  return (
    <dl className="summary-list">
      <div><dt>Average transaction</dt><dd>{formatMoney(stats.averageAmount)}</dd></div>
      <div><dt>Receipts issued</dt><dd>{stats.receiptCount}</dd></div>
      <div><dt>Unique meters</dt><dd>{stats.uniqueMeters}</dd></div>
      <div><dt>Failed value</dt><dd>{formatMoney(stats.failedAmount)}</dd></div>
    </dl>
  );
}

function PlainInsights({ stats }) {
  const insights = plainInsights(stats);

  return (
    <Section title="What this report means" icon={ShieldCheck}>
      <div className="plain-insights">
        {insights.map((insight) => (
          <article className={`plain-insight ${insight.tone}`} key={insight.title}>
            <span>{insight.title}</span>
            <strong>{insight.message}</strong>
          </article>
        ))}
      </div>
    </Section>
  );
}

function InsightsSection({ insights }) {
  const items = [
    ["Best time", insights?.best_window || "Watching transactions as they come in"],
    ["Problem signal", insights?.risk_signal || "No unusual failed payments in this view"],
    ["Next step", insights?.action || "Refresh when you want the newest transactions"]
  ];

  return (
    <Section title="What to watch" icon={Gauge}>
      <div className="insight-cards">
        {items.map(([label, value]) => (
          <article className="insight-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
    </Section>
  );
}

function HeroStat({ label, value, icon: Icon, tone = "sky" }) {
  return (
    <div className="hero-stat">
      {Icon ? (
        <span className={`hero-stat-icon tone-${tone}`}>
          <Icon size={20} strokeWidth={2.4} />
        </span>
      ) : null}
      <div className="hero-stat-text">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function HeroTrend({ value }) {
  if (value === null || value === undefined || value === 0) {
    return null;
  }

  const up = value > 0;

  return (
    <span className={`hero-trend ${up ? "up" : "down"}`}>
      {up ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
      {Math.abs(value)}% vs prev
    </span>
  );
}

function Sparkline({ rows }) {
  if (!rows || rows.length < 2) {
    return null;
  }

  const values = rows.map((row) => row.amount);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const width = 280;
  const height = 52;
  const step = width / (values.length - 1);
  const points = values.map((value, index) => [index * step, height - ((value - min) / span) * height]);
  const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg className="hero-spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <path className="hero-spark-area" d={area} />
      <path className="hero-spark-line" d={line} />
      <circle className="hero-spark-dot" cx={lastX} cy={lastY} r="3" />
    </svg>
  );
}

function NavButton({ active, icon: Icon, children, ...props }) {
  return (
    <button className={active ? "active" : ""} type="button" {...props}>
      <Icon size={18} />
      {children}
    </button>
  );
}

function normalizeStats(reports, rows) {
  const summary = reports?.summary;

  if (summary) {
    return {
      totalCount: summary.total_count,
      successCount: summary.success_count,
      failedCount: summary.failed_count,
      pendingCount: summary.pending_count,
      totalAmount: summary.total_amount,
      failedAmount: summary.failed_amount,
      averageAmount: summary.average_amount,
      receiptCount: summary.receipt_count,
      uniqueMeters: summary.unique_meters,
      successRate: summary.success_rate,
      dailyTotals: summary.daily_totals || [],
      topMeters: summary.top_meters || [],
      trends: summary.trends || null,
      insights: summary.insights || null
    };
  }

  return { ...calculateStats(rows), topMeters: [], trends: null, insights: null };
}

function deltaProps(value, kind, invert = false) {
  if (value === null || value === undefined || value === 0) {
    return {};
  }

  const positive = value > 0;
  const good = invert ? !positive : positive;
  const sign = positive ? "+" : "";
  const text = kind === "points" ? `${sign}${value} pts` : `${sign}${value}%`;

  return { delta: `${text} vs prev`, deltaTone: good ? "up" : "down" };
}

function sortRows(rows, sort) {
  if (!sort.key) {
    return rows;
  }

  const numeric = sort.key === "amount";
  const direction = sort.dir === "asc" ? 1 : -1;

  return [...rows].sort((left, right) => {
    const a = left[sort.key];
    const b = right[sort.key];

    if (numeric) {
      return (toNumber(a) - toNumber(b)) * direction;
    }

    return String(a ?? "").localeCompare(String(b ?? "")) * direction;
  });
}

function rangeBounds(range) {
  if (range === "all") {
    return { from: "", to: "" };
  }

  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  const start = new Date(today);

  if (range === "7d") {
    start.setDate(start.getDate() - 6);
  } else if (range === "30d") {
    start.setDate(start.getDate() - 29);
  }

  return { from: start.toISOString().slice(0, 10), to };
}

function presetFilters(preset) {
  const today = new Date();
  const todayText = dateInputValue(today);

  if (preset === "today") {
    return { from: todayText, to: todayText, range: "today" };
  }

  if (preset === "yesterday") {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const value = dateInputValue(yesterday);
    return { from: value, to: value, range: "all" };
  }

  if (preset === "7d") {
    return { ...rangeBounds("7d"), range: "7d" };
  }

  if (preset === "success") {
    return { status: "SUCCESS", range: "all" };
  }

  if (preset === "failed") {
    return { status: "FAILED", range: "all" };
  }

  return { range: "all" };
}

function dateInputValue(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function rangeLabel(range) {
  return {
    today: "Today at a glance",
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    all: "All transactions"
  }[range];
}

function loadStoredFilters() {
  return { ...initialFilters };
}

function plainInsights(stats) {
  const highestDay = stats.dailyTotals.reduce((winner, row) => toNumber(row.amount) > toNumber(winner?.amount) ? row : winner, null);
  const failedMessage = stats.failedCount
    ? `${stats.failedCount} transaction${stats.failedCount === 1 ? "" : "s"} failed and may need attention.`
    : "No failed transactions in this view.";
  const successMessage = stats.totalCount
    ? `${stats.successRate}% of transactions were successful.`
    : "No transactions are currently selected.";
  const moneyMessage = stats.totalAmount
    ? `${formatMoney(stats.totalAmount)} came from successful transactions.`
    : "No successful amount is showing in this view.";
  const peakMessage = highestDay
    ? `${shortDate(highestDay.date)} had the highest successful amount at ${formatMoney(highestDay.amount)}.`
    : "There is no daily trend yet.";

  return [
    { title: "Overall health", message: successMessage, tone: stats.successRate >= 90 ? "good" : stats.successRate >= 70 ? "watch" : "bad" },
    { title: "Money collected", message: moneyMessage, tone: "good" },
    { title: "Needs review", message: failedMessage, tone: stats.failedCount ? "bad" : "good" },
    { title: "Best day", message: peakMessage, tone: "watch" }
  ];
}

function calculateStats(rows) {
  const successRows = rows.filter((row) => isSuccess(row.status));
  const failedRows = rows.filter((row) => String(row.status || "").toUpperCase() === "FAILED");
  const pendingRows = rows.filter((row) => !isSuccess(row.status) && String(row.status || "").toUpperCase() !== "FAILED");
  const totalAmount = successRows.reduce((sum, row) => sum + toNumber(row.amount), 0);
  const failedAmount = failedRows.reduce((sum, row) => sum + toNumber(row.amount), 0);
  const dailyMap = new Map();

  successRows.forEach((row) => {
    const date = String(row.created_at || "Undated").slice(0, 10);
    dailyMap.set(date, (dailyMap.get(date) || 0) + toNumber(row.amount));
  });

  const dailyTotals = Array.from(dailyMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-7)
    .map(([date, amount]) => ({ date, amount }));

  return {
    totalCount: rows.length,
    successCount: successRows.length,
    failedCount: failedRows.length,
    pendingCount: pendingRows.length,
    totalAmount,
    failedAmount,
    averageAmount: successRows.length ? totalAmount / successRows.length : 0,
    receiptCount: rows.filter((row) => row.receipt_no).length,
    uniqueMeters: new Set(rows.map((row) => row.meter_number).filter(Boolean)).size,
    successRate: rows.length ? Math.round((successRows.length / rows.length) * 100) : 0,
    dailyTotals
  };
}

function formatMoney(value) {
  const amount = toNumber(value);

  return new Intl.NumberFormat("en-BW", {
    style: "currency",
    currency: "BWP",
    maximumFractionDigits: 2
  }).format(amount);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-BW", { maximumFractionDigits: 2 }).format(toNumber(value));
}

function formatCompactMoney(value) {
  return new Intl.NumberFormat("en-BW", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(toNumber(value));
}

function shortDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value || "").slice(5);
  }

  return date.toLocaleDateString("en-BW", { month: "short", day: "numeric" });
}

function peakDay(rows) {
  const peak = rows.reduce((winner, row) => (toNumber(row.amount) > toNumber(winner?.amount) ? row : winner), null);
  return peak ? `${shortDate(peak.date)} · ${formatMoney(peak.amount)}` : "No transactions";
}

function smoothPath(points) {
  if (!points.length) {
    return "";
  }

  if (points.length === 1) {
    const point = points[0];
    return `M${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }

  return points.reduce((path, point, index) => {
    if (index === 0) {
      return `M${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    }

    const previous = points[index - 1];
    const controlDistance = (point.x - previous.x) * 0.5;
    const c1x = previous.x + controlDistance;
    const c2x = point.x - controlDistance;

    return `${path} C${c1x.toFixed(1)},${previous.y.toFixed(1)} ${c2x.toFixed(1)},${point.y.toFixed(1)} ${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }, "");
}

function toNumber(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

function isSuccess(status) {
  const normalized = String(status || "").toUpperCase();
  return normalized === "SUCCESS" || normalized === "SUCCESSFUL";
}

function viewTitle(view) {
  return {
    dashboard: "Dashboard",
    reports: "Reports",
    transactions: "Transactions",
    email: "Email Reports"
  }[view];
}

function viewHelp(view) {
  return {
    dashboard: "A quick view of what is happening right now.",
    reports: "Filter, compare, and download transaction reports.",
    transactions: "Review individual transaction records.",
    email: "Choose who receives the automatic 2 AM daily report."
  }[view];
}

function useStoredSession() {
  const [session, setSessionState] = useState(() => {
    try {
      const storedSession = JSON.parse(localStorage.getItem(sessionKey));

      if (storedSession?.apiToken && (!defaultApiToken || storedSession.apiToken === defaultApiToken)) {
        return storedSession;
      }
    } catch {
      // Fall through to the configured reporting token.
    }

    return defaultApiToken
      ? {
          apiToken: defaultApiToken,
          baseUrl: defaultBaseUrl,
          source: demoMode ? "Demo data" : "Live data",
          signedInAt: new Date().toISOString()
        }
      : null;
  });

  function setSession(nextSession) {
    setSessionState(nextSession);

    if (nextSession) {
      localStorage.setItem(sessionKey, JSON.stringify(nextSession));
    } else {
      localStorage.removeItem(sessionKey);
    }
  }

  return [session, setSession];
}

export default App;
