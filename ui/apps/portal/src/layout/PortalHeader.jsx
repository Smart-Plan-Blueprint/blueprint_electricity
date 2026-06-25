import { ArrowDownToLine, RefreshCw, Search, Zap } from "lucide-react";
import { Button } from "@blueprint/ui";
import AutoRefreshToggle from "./AutoRefreshToggle";
import LastUpdated from "./LastUpdated";
import { viewTitle } from "../utils/helpers";

export default function PortalHeader({
  activeView,
  updatedAt,
  loading,
  search,
  setSearch,
  searchInputRef,
  runSearch,
  autoRefresh,
  onToggleAutoRefresh,
  onRefresh,
  onExport,
  rows
}) {
  const showReportActions = ["dashboard", "reports", "transactions"].includes(activeView);
  const today = new Date().toLocaleDateString("en-BW", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });

  return (
    <header className="portal-header">
      <div className="portal-header__utility">
        {showReportActions ? (
          <form className="header-search" onSubmit={runSearch}>
            <Search size={16} />
            <input
              ref={searchInputRef}
              value={search}
              placeholder="Search transactions..."
              onChange={(event) => setSearch(event.target.value)}
            />
          </form>
        ) : null}

        <div className="portal-header__tools">
          {showReportActions ? (
            <>
              <AutoRefreshToggle enabled={autoRefresh} onToggle={onToggleAutoRefresh} />
              <Button icon={RefreshCw} variant="ghost" loading={loading === "reports"} onClick={onRefresh}>Refresh</Button>
              <Button icon={ArrowDownToLine} loading={loading === "export"} onClick={onExport} disabled={!rows.length}>Download Excel</Button>
            </>
          ) : null}

          <div className="portal-header__meta">
            <strong>Reporting Portal</strong>
            <span>{today}</span>
          </div>
        </div>
      </div>

      <div className="portal-header__title-row">
        <div className="header-title">
          <h1>{viewTitle(activeView)}</h1>
          <span className="portal-header__pill portal-header__pill--ghost">Admin Workspace</span>
          <LastUpdated updatedAt={updatedAt} loading={loading === "reports"} />
        </div>

        <span className="portal-header__pill portal-header__pill--brand">
          <Zap size={14} />
          Smart Plan Blueprint
        </span>
      </div>
    </header>
  );
}
