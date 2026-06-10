import { FileSearch, Search } from "lucide-react";
import { Button, Field, Section } from "@blueprint/ui";

export default function ReportFilters({ filters, setFilters, updateForm, loading, onSubmit, onClear, onPreset }) {
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
