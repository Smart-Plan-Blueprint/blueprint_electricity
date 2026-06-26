import { useEffect, useMemo, useRef, useState } from "react";
import { createElectricityClient, createAirtimeClient } from "@blueprint/api-client";
import { createDemoReport } from "../demoData";
import { createTransactionReportWorkbook, reportWorkbookFileName } from "../xlsxReport";
import {
  airtimeReportPageSize,
  autoRefreshMs,
  defaultApiToken,
  defaultBaseUrl,
  defaultReportSettings,
  demoMode,
  filtersKey,
  initialFilters
} from "../config/reporting";
import { rangeBounds, presetFilters } from "../utils/helpers";
import { normalizeStats } from "../utils/stats";
import { filterRows, mergeAndSort, splitRowsByService } from "../utils/normalize";
import { authenticateAdmin } from "../data/adminUsers";
import useStoredSession from "./useStoredSession";

export default function useReportingPortal() {
  const [session, setSession] = useStoredSession();
  const [apiToken, setApiToken] = useState(session?.apiToken || defaultApiToken);
  const [activeView, setActiveView] = useState("dashboard");
  const [loginError, setLoginError] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
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
  const [airtimeReports, setAirtimeReports] = useState(null);
  const [airtimeLoading, setAirtimeLoading] = useState(false);
  const [airtimeFilters, setAirtimeFilters] = useState({
    per_page: String(airtimeReportPageSize),
    page: "1"
  });

  const airtimeClient = useMemo(() => createAirtimeClient(), []);

  const reportsRef = useRef(reports);
  reportsRef.current = reports;
  const searchInputRef = useRef(null);

  const client = useMemo(() => createElectricityClient({ baseUrl: defaultBaseUrl, apiToken }), [apiToken]);
  const isAuthenticated = Boolean(session?.apiToken);
  const electricityRows = reports?.data || [];
  const serviceFilter = filters._type || "";
  const electricityStats = useMemo(() => normalizeStats(reports, electricityRows), [reports, electricityRows]);
  const combinedRows = useMemo(() => {
    return filterRows(mergeAndSort(electricityRows, airtimeReports?.data), filters);
  }, [electricityRows, airtimeReports, filters]);
  const rows = combinedRows;
  const stats = useMemo(
    () => buildScopedStats(electricityStats, airtimeReports, serviceFilter, combinedRows),
    [electricityStats, airtimeReports, serviceFilter, combinedRows]
  );
  const meta = useMemo(
    () => reportMeta(serviceFilter, reports?.meta, airtimeReports?.meta),
    [serviceFilter, reports?.meta, airtimeReports?.meta]
  );

  useEffect(() => {
    if (isAuthenticated) {
      refreshReports();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && activeView === "email") {
      loadReportSettings();
    }
  }, [isAuthenticated, activeView]);

  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) {
      return undefined;
    }

    const timer = setInterval(() => refreshReports(), autoRefreshMs);
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
        refreshReports();
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

  function startSession(token, source = demoMode ? "Demo data" : "Live data", user = null) {
    const nextSession = {
      apiToken: token,
      baseUrl: defaultBaseUrl,
      source,
      name: user?.name || null,
      email: user?.email || null,
      role: user?.role || null,
      signedInAt: new Date().toISOString()
    };

    setApiToken(token);
    setSession(nextSession);
    setLoginError("");
    setActiveView("dashboard");
  }

  function handleCredentialLogin(event) {
    event.preventDefault();
    setLoginError("");

    const user = authenticateAdmin(adminEmail, adminPassword);

    if (!user) {
      setLoginError("Incorrect email or password.");
      return;
    }

    startSession(apiToken?.trim() || defaultApiToken, user.name, user);
    setAdminPassword("");
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
      () => demoMode
        ? Promise.resolve(createDemoReport({ per_page: 1 }))
        : createElectricityClient({ baseUrl: defaultBaseUrl, apiToken: apiToken.trim() }).transactionLogs({ per_page: 1 }),
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
      const apiFilters = reportApiFilters(nextFilters);
      const result = demoMode ? createDemoReport(apiFilters) : await client.transactionLogs(apiFilters);
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

  function refreshReports(nextFilters = filters) {
    const nextAirtimeFilters = airtimeApiFilters(nextFilters);
    setAirtimeFilters(nextAirtimeFilters);
    loadReports(nextFilters);
    loadAirtime(nextAirtimeFilters);
  }

  async function loadAirtime(nextFilters = airtimeFilters) {
    setAirtimeLoading(true);
    try {
      const result = await airtimeClient.transactionLogs(nextFilters);
      setAirtimeReports(result);
    } catch (error) {
      pushToast("error", `Could not load airtime data: ${error.message}`);
    } finally {
      setAirtimeLoading(false);
    }
  }

  function goToAirtimePage(page) {
    const next = { ...airtimeFilters, page: String(page) };
    setAirtimeFilters(next);
    loadAirtime(next);
  }

  function setServiceFilter(value) {
    applyFilters({ _type: value });
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
    refreshReports(merged);
  }

  function clearFilters() {
    const next = { ...initialFilters };
    setSearch("");
    setRange("all");
    setFilters(next);
    refreshReports(next);
  }

  function applyPreset(preset) {
    const next = presetFilters(preset);
    setSearch("");
    setRange(next.range || "all");
    delete next.range;
    const merged = { ...initialFilters, ...next, page: "1" };
    setFilters(merged);
    refreshReports(merged);
  }

  function handleFilterSubmit(event) {
    event.preventDefault();
    applyFilters({});
  }

  function goToPage(page) {
    const merged = { ...filters, page: String(page) };
    setFilters(merged);
    refreshReports(merged);
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
      const { electricityRows: exportElectricityRows, airtimeRows: exportAirtimeRows } = splitRowsByService(rows);
      const blob = createTransactionReportWorkbook({
        electricityRows: exportElectricityRows,
        airtimeRows: exportAirtimeRows
      }, filters);
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

  return {
    session,
    apiToken,
    setApiToken,
    activeView,
    setActiveView,
    loginError,
    adminEmail,
    adminPassword,
    setAdminEmail,
    setAdminPassword,
    filters,
    setFilters,
    reports,
    loading,
    range,
    serviceFilter,
    autoRefresh,
    setAutoRefresh,
    updatedAt,
    selected,
    setSelected,
    toasts,
    search,
    setSearch,
    reportSettings,
    setReportSettings,
    recipientDraft,
    setRecipientDraft,
    searchInputRef,
    isAuthenticated,
    rows,
    stats,
    electricityStats,
    meta,
    updateForm,
    pushToast,
    dismissToast,
    handleTokenLogin,
    handleCredentialLogin,
    handleLogout,
    loadReports,
    refreshReports,
    addRecipient,
    removeRecipient,
    saveReportSettings,
    sendTestReport,
    clearFilters,
    applyPreset,
    handleFilterSubmit,
    goToPage,
    selectRange,
    filterByStatus,
    runSearch,
    exportReport,
    airtimeReports,
    airtimeLoading,
    airtimeFilters,
    setAirtimeFilters,
    loadAirtime,
    goToAirtimePage,
    setServiceFilter,
    combinedRows
  };
}

function loadStoredFilters() {
  return { ...initialFilters };
}

function reportApiFilters(filters = {}) {
  const { _type, ...query } = filters;
  return query;
}

function airtimeApiFilters(filters = {}) {
  const query = reportApiFilters(filters);

  query.page = "1";
  query.per_page = String(airtimeReportPageSize);

  if (query.meter_number) {
    query.phonenumber = query.meter_number;
    query.phone_number = query.meter_number;
  }

  return query;
}

function buildScopedStats(electricityStats, airtimeReports, serviceFilter, rows) {
  const rowStats = normalizeStats(null, rows);

  if (serviceFilter === "electricity") {
    return { ...rowStats, ...electricityStats };
  }

  const { airtimeRows } = splitRowsByService(rows);
  const airtimeRowStats = normalizeStats(null, airtimeRows);
  const airtimeStats = statsFromAirtimeReport(airtimeReports, airtimeRowStats);

  if (serviceFilter === "airtime") {
    return {
      ...airtimeRowStats,
      ...airtimeStats,
      dailyTotals: airtimeRowStats.dailyTotals
    };
  }

  const totalCount = Number(electricityStats.totalCount ?? 0) + airtimeStats.totalCount;
  const successCount = Number(electricityStats.successCount ?? 0) + airtimeStats.successCount;
  const failedCount = Number(electricityStats.failedCount ?? 0) + airtimeStats.failedCount;
  const totalAmount = Number(electricityStats.totalAmount ?? 0) + airtimeStats.totalAmount;
  const failedAmount = Number(electricityStats.failedAmount ?? 0) + airtimeStats.failedAmount;

  return {
    ...rowStats,
    ...electricityStats,
    totalCount,
    successCount,
    failedCount,
    totalAmount,
    failedAmount,
    averageAmount: successCount ? totalAmount / successCount : 0,
    successRate: totalCount ? Math.round((successCount / totalCount) * 100) : 0,
    dailyTotals: rowStats.dailyTotals?.length ? rowStats.dailyTotals : electricityStats.dailyTotals || [],
    topMeters: electricityStats.topMeters || []
  };
}

function statsFromAirtimeReport(airtimeReports, fallbackStats) {
  const summary = airtimeReports?.summary || {};
  const totalCount = Number(summary.total ?? summary.total_count ?? fallbackStats.totalCount ?? 0);
  const successCount = Number(summary.successful ?? summary.success_count ?? fallbackStats.successCount ?? 0);
  const failedCount = Number(summary.failed ?? summary.failed_count ?? Math.max(totalCount - successCount, 0));
  const totalAmount = Number(summary.total_amount ?? fallbackStats.totalAmount ?? 0);
  const failedAmount = Number(summary.failed_amount ?? fallbackStats.failedAmount ?? 0);

  return {
    ...fallbackStats,
    totalCount,
    successCount,
    failedCount,
    totalAmount,
    failedAmount,
    averageAmount: successCount ? totalAmount / successCount : 0,
    successRate: totalCount ? Math.round((successCount / totalCount) * 100) : 0,
    receiptCount: 0,
    uniqueMeters: 0,
    topMeters: []
  };
}

function reportMeta(serviceFilter, electricityMeta, airtimeMeta) {
  if (serviceFilter === "electricity") {
    return electricityMeta || null;
  }

  if (serviceFilter === "airtime") {
    return airtimeMeta || null;
  }

  return null;
}
