import { ArrowDownToLine, RefreshCw, Search } from "lucide-react";
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

  return (
    <header className="portal-header">
      <div className="header-title">
        <h1>{viewTitle(activeView)}</h1>
        <LastUpdated updatedAt={updatedAt} loading={loading === "reports"} />
      </div>
      {showReportActions ? (
      <div className="header-actions">
        <form className="header-search" onSubmit={runSearch}>
          <Search size={16} />
          <input
            ref={searchInputRef}
            value={search}
            placeholder="Search transactions..."
            onChange={(event) => setSearch(event.target.value)}
          />
        </form>
        <AutoRefreshToggle enabled={autoRefresh} onToggle={onToggleAutoRefresh} />
        <Button icon={RefreshCw} variant="ghost" loading={loading === "reports"} onClick={onRefresh}>Refresh</Button>
        <Button icon={ArrowDownToLine} loading={loading === "export"} onClick={onExport} disabled={!rows.length}>Download Excel</Button>
      </div>
      ) : null}
    </header>
  );
}
