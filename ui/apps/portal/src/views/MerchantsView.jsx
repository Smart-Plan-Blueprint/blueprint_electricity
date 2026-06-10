import { Building2, CheckCircle2, Clock3, Percent, Plus, Search, Wallet } from "lucide-react";
import { Button, MetricCard, Section } from "@blueprint/ui";
import { formatMoney } from "../utils/formatters";
import { merchantStatuses } from "../data/merchantData";
import MerchantTable from "../components/merchants/MerchantTable";
import MerchantDrawer from "../components/merchants/MerchantDrawer";
import MerchantFormModal from "../components/merchants/MerchantFormModal";

export default function MerchantsView({ merchants }) {
  const { stats } = merchants;

  return (
    <div className="view-stack">
      <div className="metrics-grid">
        <MetricCard icon={Building2} label="Merchants" value={stats.total} />
        <MetricCard icon={CheckCircle2} label="Active" value={stats.active} tone="good" />
        <MetricCard icon={Clock3} label="Pending KYC" value={stats.pending} tone="warn" />
        <MetricCard icon={Wallet} label="Total float" value={formatMoney(stats.float)} />
        <MetricCard icon={Percent} label="Avg commission" value={`${stats.avgCommission.toFixed(2)}%`} />
      </div>

      <Section title="Merchant accounts" icon={Building2}>
        <div className="merchant-toolbar">
          <div className="merchant-search">
            <Search size={15} />
            <input
              type="search"
              value={merchants.search}
              onChange={(event) => merchants.setSearch(event.target.value)}
              placeholder="Search by name, contact, email, reg. number"
            />
          </div>
          <select value={merchants.statusFilter} onChange={(event) => merchants.setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {merchantStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <Button icon={Plus} onClick={merchants.openCreate}>Onboard merchant</Button>
        </div>

        <MerchantTable merchants={merchants.merchants} onSelect={merchants.selectMerchant} />
      </Section>

      {merchants.selected ? (
        <MerchantDrawer
          merchant={merchants.selected}
          actions={merchants}
          onEdit={merchants.openEdit}
          onClose={merchants.closeDrawer}
        />
      ) : null}

      {merchants.formOpen ? (
        <MerchantFormModal editing={merchants.editing} onSave={merchants.saveMerchant} onClose={merchants.closeForm} />
      ) : null}
    </div>
  );
}
