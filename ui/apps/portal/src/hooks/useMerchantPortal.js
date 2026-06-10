import { useEffect, useMemo, useState } from "react";
import { buildReport } from "../demoData";
import { createMerchantTransactions } from "../data/merchantData";
import { initialFilters } from "../config/reporting";
import { rangeBounds, presetFilters } from "../utils/helpers";
import { normalizeStats } from "../utils/stats";

export default function useMerchantPortal(merchant) {
  const [activeView, setActiveView] = useState("dashboard");
  const [filters, setFilters] = useState({ ...initialFilters });
  const [range, setRange] = useState("all");
  const [reports, setReports] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState("");

  const transactions = useMemo(() => createMerchantTransactions(merchant), [merchant.id]);

  function loadReports(nextFilters = filters) {
    setLoading("reports");
    setReports(buildReport(transactions, nextFilters));
    setLoading("");
  }

  useEffect(() => {
    setActiveView("dashboard");
    setFilters({ ...initialFilters });
    setRange("all");
    setReports(buildReport(transactions, { ...initialFilters }));
  }, [merchant.id]);

  const rows = reports?.data || [];
  const stats = useMemo(() => normalizeStats(reports, rows), [reports, rows]);
  const meta = reports?.meta || null;

  function applyFilters(nextFilters) {
    const merged = { ...filters, ...nextFilters, page: "1" };
    setFilters(merged);
    loadReports(merged);
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

  function applyPreset(preset) {
    const next = presetFilters(preset);
    setSearch("");
    setRange(next.range || "all");
    delete next.range;
    applyFilters({ ...initialFilters, ...next });
  }

  function clearFilters() {
    setSearch("");
    setRange("all");
    setFilters({ ...initialFilters });
    loadReports({ ...initialFilters });
  }

  function handleFilterSubmit(event) {
    event.preventDefault();
    applyFilters({});
  }

  function runSearch(event) {
    event.preventDefault();
    applyFilters({ search: search.trim() });
  }

  function updateForm(setter, field, value) {
    setter((current) => ({ ...current, [field]: value }));
  }

  return {
    merchant,
    activeView,
    setActiveView,
    filters,
    setFilters,
    range,
    reports,
    rows,
    stats,
    meta,
    loading,
    selected,
    setSelected,
    search,
    setSearch,
    loadReports,
    selectRange,
    filterByStatus,
    applyPreset,
    clearFilters,
    handleFilterSubmit,
    runSearch,
    goToPage,
    updateForm
  };
}
