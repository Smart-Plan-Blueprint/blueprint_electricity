import { FileSearch, Search } from "lucide-react";
import { Button, Field, Section } from "@blueprint/ui";

const PRESETS = [
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["7d", "Last 7 days"],
  ["success", "Successful only"],
  ["failed", "Failed only"]
];

export default function ReportFilters({ filters, setFilters, updateForm, loading, onSubmit, onClear, onPreset }) {
  return (
    <Section title="Find transactions" icon={FileSearch}>
      <div className="preset-row">
        {PRESETS.map(([key, label]) => (
          <button key={key} type="button" onClick={() => onPreset(key)}>{label}</button>
        ))}
      </div>

      <form className="filter-grid" onSubmit={onSubmit}>
        <Field label="Start date" type="date" value={filters.from} onChange={(e) => updateForm(setFilters, "from", e.target.value)} />
        <Field label="End date" type="date" value={filters.to} onChange={(e) => updateForm(setFilters, "to", e.target.value)} />
        <Field label="Transaction ID" value={filters.transaction_id} placeholder="e.g. TXN-00123" onChange={(e) => updateForm(setFilters, "transaction_id", e.target.value)} />
        <Field label="Meter number" value={filters.meter_number} placeholder="e.g. 14020123456" onChange={(e) => updateForm(setFilters, "meter_number", e.target.value)} />

        <label className="field">
          <span>Result</span>
          <select value={filters.status} onChange={(e) => updateForm(setFilters, "status", e.target.value)}>
            <option value="">All results</option>
            <option value="SUCCESS">Successful</option>
            <option value="FAILED">Failed</option>
          </select>
        </label>

        <label className="field">
          <span>Type</span>
          <select value={filters._type || ""} onChange={(e) => updateForm(setFilters, "_type", e.target.value)}>
            <option value="">All types</option>
            <option value="electricity">Electricity</option>
            <option value="airtime">Airtime</option>
          </select>
        </label>

        <div className="filter-actions">
          <Button icon={Search} loading={loading === "reports"}>Apply filters</Button>
          <button type="button" className="ghost-button" onClick={onClear}>Clear</button>
        </div>
      </form>
    </Section>
  );
}
