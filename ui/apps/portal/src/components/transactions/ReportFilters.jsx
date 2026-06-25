import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@blueprint/ui";

const SCOPES = [
  ["all", "All fields"],
  ["txn", "Transaction ID"],
  ["meter", "Meter / phone"]
];

const scopeField = (scope) =>
  scope === "txn" ? "transaction_id" : scope === "meter" ? "meter_number" : "search";

export default function ReportFilters({
  filters,
  setFilters,
  updateForm,
  loading,
  onSubmit,
  onClear,
  resultCount,
  totalCount
}) {
  const [scope, setScope] = useState("all");
  const field = scopeField(scope);

  function changeScope(next) {
    setFilters((current) => ({ ...current, search: "", transaction_id: "", meter_number: "" }));
    setScope(next);
  }

  return (
    <div className="filter-bar">
      <form className="filter-bar__row" onSubmit={onSubmit}>
        <select
          className="filter-bar__select"
          value={scope}
          onChange={(event) => changeScope(event.target.value)}
          aria-label="Search scope"
        >
          {SCOPES.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <div className="filter-bar__search">
          <Search size={16} />
          <input
            value={filters[field] || ""}
            placeholder={
              scope === "txn"
                ? "Search transaction ID..."
                : scope === "meter"
                ? "Search meter / phone..."
                : "Search all fields..."
            }
            onChange={(event) => updateForm(setFilters, field, event.target.value)}
          />
        </div>

        <select
          className="filter-bar__select"
          value={filters.status}
          onChange={(event) => updateForm(setFilters, "status", event.target.value)}
          aria-label="Status"
        >
          <option value="">All statuses</option>
          <option value="SUCCESS">Successful</option>
          <option value="FAILED">Failed</option>
        </select>

        <select
          className="filter-bar__select"
          value={filters._type || ""}
          onChange={(event) => updateForm(setFilters, "_type", event.target.value)}
          aria-label="Service"
        >
          <option value="">All services</option>
          <option value="electricity">Electricity</option>
          <option value="airtime">Airtime</option>
        </select>

        <Button icon={Search} loading={loading === "reports"}>Apply</Button>
      </form>

      <div className="filter-bar__meta">
        <span>
          {resultCount} / {totalCount} transactions
        </span>
        <button type="button" className="filter-bar__clear" onClick={onClear}>Clear</button>
      </div>
    </div>
  );
}
