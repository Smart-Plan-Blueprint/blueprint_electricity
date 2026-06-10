import { ReceiptText } from "lucide-react";
import { Section } from "@blueprint/ui";
import ReportFilters from "../components/transactions/ReportFilters";
import TransactionTable from "../components/transactions/TransactionTable";
import Pagination from "../components/transactions/Pagination";

export default function TransactionsView({ filters, setFilters, updateForm, loading, onSubmit, onClear, onPreset, rows, reports, meta, onSelectRow, onPage }) {
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
