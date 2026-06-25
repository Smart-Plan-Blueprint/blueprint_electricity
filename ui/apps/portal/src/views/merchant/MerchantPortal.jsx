import { FileSearch, LayoutDashboard, LogOut, PlugZap, Wallet } from "lucide-react";
import { StatusBadge } from "@blueprint/ui";
import useMerchantPortal from "../../hooks/useMerchantPortal";
import NavButton from "../../components/common/NavButton";
import DashboardView from "../DashboardView";
import TransactionsView from "../TransactionsView";
import MerchantWalletView from "./MerchantWalletView";
import TransactionDrawer from "../../components/transactions/TransactionDrawer";

const titles = {
  dashboard: "Dashboard",
  transactions: "Transactions",
  wallet: "Wallet"
};

const helps = {
  dashboard: "Your sales, success rate, and recent activity.",
  transactions: "Every electricity vend on your account.",
  wallet: "Your float balance, commission, and movements."
};

export default function MerchantPortal({ merchant, onLogout }) {
  const portal = useMerchantPortal(merchant);

  return (
    <main className="portal-shell">
      <aside className="sp-sidebar">
        <div className="sp-sidebar__brand">
          <div className="sp-sidebar__mark"><PlugZap size={20} /></div>
          <div className="sp-sidebar__brand-text">
            <p className="sp-sidebar__eyebrow">Smart Plan Blueprint</p>
            <h1>Merchant Portal</h1>
          </div>
        </div>

        <div className="sp-sidebar__active-card">
          <span className="sp-sidebar__active-bar" />
          <p className="sp-sidebar__eyebrow">Account</p>
          <strong>{merchant.name}</strong>
          <div className="sp-sidebar__active-status">
            <span>Status</span>
            <StatusBadge status={merchant.status} />
          </div>
        </div>

        <nav className="sp-sidebar__nav" aria-label="Main navigation">
          <p className="sp-sidebar__nav-label">Navigation</p>
          <NavButton active={portal.activeView === "dashboard"} icon={LayoutDashboard} onClick={() => portal.setActiveView("dashboard")}>Dashboard</NavButton>
          <NavButton active={portal.activeView === "transactions"} icon={FileSearch} onClick={() => portal.setActiveView("transactions")}>Transactions</NavButton>
          <NavButton active={portal.activeView === "wallet"} icon={Wallet} onClick={() => portal.setActiveView("wallet")}>Wallet</NavButton>
        </nav>

        <div className="sp-sidebar__footer">
          <div className="sp-sidebar__user">
            <div className="sp-sidebar__avatar">{merchant.name.charAt(0).toUpperCase()}</div>
            <div className="sp-sidebar__user-text">
              <strong>{merchant.name}</strong>
              <small>{merchant.email || "Merchant account"}</small>
            </div>
          </div>

          <button type="button" className="sp-sidebar__signout" onClick={onLogout}>
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      <section className="portal-main">
        <header className="portal-header">
          <div className="portal-header__title-row">
            <div className="header-title">
              <h1>{titles[portal.activeView]}</h1>
              <span className="portal-header__pill portal-header__pill--ghost">Merchant Workspace</span>
            </div>
            <span className="portal-header__pill portal-header__pill--brand">
              <Wallet size={14} />
              {merchant.name}
            </span>
          </div>
          <p className="page-help">{helps[portal.activeView]}</p>
        </header>

        {portal.activeView === "dashboard" && (
          <DashboardView
            stats={portal.stats}
            rows={portal.rows}
            reports={portal.reports}
            meta={portal.meta}
            loading={portal.loading}
            range={portal.range}
            onSelectRange={portal.selectRange}
            onRefresh={() => portal.loadReports()}
            onStatusFilter={portal.filterByStatus}
            onSelectRow={portal.setSelected}
            onPage={portal.goToPage}
          />
        )}

        {portal.activeView === "transactions" && (
          <TransactionsView
            filters={portal.filters}
            setFilters={portal.setFilters}
            updateForm={portal.updateForm}
            loading={portal.loading}
            onSubmit={portal.handleFilterSubmit}
            onClear={portal.clearFilters}
            onPreset={portal.applyPreset}
            rows={portal.rows}
            reports={portal.reports}
            meta={portal.meta}
            onSelectRow={portal.setSelected}
            onPage={portal.goToPage}
          />
        )}

        {portal.activeView === "wallet" && (
          <MerchantWalletView merchant={merchant} stats={portal.stats} />
        )}
      </section>

      {portal.selected ? <TransactionDrawer row={portal.selected} onClose={() => portal.setSelected(null)} /> : null}
    </main>
  );
}
