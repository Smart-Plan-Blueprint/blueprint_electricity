import { useState } from "react";
import useReportingPortal from "./hooks/useReportingPortal";
import useMerchants from "./hooks/useMerchants";
import AuthScreen from "./views/AuthScreen";
import DashboardView from "./views/DashboardView";
import ReportsView from "./views/ReportsView";
import TransactionsView from "./views/TransactionsView";
import MerchantsView from "./views/MerchantsView";
import MerchantPortal from "./views/merchant/MerchantPortal";
import EmailReportsView from "./views/EmailReportsView";
import AirtimeView from "./views/AirtimeView";
import Sidebar from "./layout/Sidebar";
import PortalHeader from "./layout/PortalHeader";
import TransactionDrawer from "./components/transactions/TransactionDrawer";
import ToastStack from "./components/common/ToastStack";

const merchantSessionKey = "blueprint-merchant-session";

function App() {
  const portal = useReportingPortal();
  const merchants = useMerchants(portal.pushToast);

  const [authMode, setAuthMode] = useState("admin");
  const [merchantEmail, setMerchantEmail] = useState("");
  const [merchantPassword, setMerchantPassword] = useState("");
  const [merchantError, setMerchantError] = useState("");
  const [merchantSessionId, setMerchantSessionId] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(merchantSessionKey))?.id || null;
    } catch {
      return null;
    }
  });

  const merchantSession = merchantSessionId ? merchants.findMerchant(merchantSessionId) : null;

  function handleMerchantLogin(event) {
    event.preventDefault();
    setMerchantError("");
    const matched = merchants.authenticate(merchantEmail, merchantPassword);

    if (!matched) {
      setMerchantError("We could not find an account with those details.");
      return;
    }

    if (matched.status !== "ACTIVE") {
      setMerchantError("This account is not active yet. Please contact Smart Plan Blueprint.");
      return;
    }

    setMerchantSessionId(matched.id);
    localStorage.setItem(merchantSessionKey, JSON.stringify({ id: matched.id }));
    setMerchantPassword("");
  }

  function handleMerchantLogout() {
    setMerchantSessionId(null);
    localStorage.removeItem(merchantSessionKey);
    setMerchantEmail("");
    setMerchantPassword("");
    setAuthMode("admin");
  }

  if (merchantSession) {
    return <MerchantPortal merchant={merchantSession} onLogout={handleMerchantLogout} />;
  }

  if (!portal.isAuthenticated) {
    return (
      <AuthScreen
        loginError={portal.loginError}
        loading={portal.loading}
        adminEmail={portal.adminEmail}
        adminPassword={portal.adminPassword}
        setAdminEmail={portal.setAdminEmail}
        setAdminPassword={portal.setAdminPassword}
        onAdminLogin={portal.handleCredentialLogin}
        mode={authMode}
        setMode={setAuthMode}
        merchantEmail={merchantEmail}
        merchantPassword={merchantPassword}
        setMerchantEmail={setMerchantEmail}
        setMerchantPassword={setMerchantPassword}
        merchantError={merchantError}
        onMerchantLogin={handleMerchantLogin}
      />
    );
  }

  return (
    <main className="portal-shell">
      <Sidebar
        activeView={portal.activeView}
        onViewChange={portal.setActiveView}
        session={portal.session}
        onLogout={portal.handleLogout}
      />

      <section className="portal-main">
        <PortalHeader
          activeView={portal.activeView}
          updatedAt={portal.updatedAt}
          loading={portal.loading}
          search={portal.search}
          setSearch={portal.setSearch}
          searchInputRef={portal.searchInputRef}
          runSearch={portal.runSearch}
          autoRefresh={portal.autoRefresh}
          onToggleAutoRefresh={() => portal.setAutoRefresh((value) => !value)}
          onRefresh={() => portal.loadReports()}
          onExport={portal.exportReport}
          rows={portal.rows}
        />

        {portal.activeView === "dashboard" && (
          <DashboardView
            stats={portal.stats}
            rows={portal.combinedRows}
            reports={portal.reports}
            meta={portal.meta}
            loading={portal.loading}
            range={portal.range}
            onSelectRange={portal.selectRange}
            onRefresh={() => portal.loadReports()}
            onStatusFilter={portal.filterByStatus}
            onSelectRow={portal.setSelected}
            onPage={portal.goToPage}
            airtimeReports={portal.airtimeReports}
            onViewAirtime={() => portal.setActiveView("airtime")}
            onOpenReports={() => portal.setActiveView("reports")}
          />
        )}

        {portal.activeView === "reports" && (
          <ReportsView
            filters={portal.filters}
            setFilters={portal.setFilters}
            updateForm={portal.updateForm}
            loading={portal.loading}
            onSubmit={portal.handleFilterSubmit}
            onClear={portal.clearFilters}
            onPreset={portal.applyPreset}
            stats={portal.stats}
            rows={portal.rows}
            reports={portal.reports}
            meta={portal.meta}
            onSelectRow={portal.setSelected}
            onPage={portal.goToPage}
            airtimeReports={portal.airtimeReports}
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
            rows={portal.combinedRows}
            reports={portal.reports}
            meta={portal.meta}
            onSelectRow={portal.setSelected}
            onPage={portal.goToPage}
          />
        )}

        {portal.activeView === "airtime" && (
          <AirtimeView
            reports={portal.airtimeReports}
            loading={portal.airtimeLoading}
            onPage={portal.goToAirtimePage}
          />
        )}

        {portal.activeView === "merchants" && (
          <MerchantsView merchants={merchants} />
        )}

        {portal.activeView === "email" && (
          <EmailReportsView
            settings={portal.reportSettings}
            recipientDraft={portal.recipientDraft}
            loading={portal.loading}
            onChange={portal.setReportSettings}
            onRecipientDraft={portal.setRecipientDraft}
            onAddRecipient={portal.addRecipient}
            onRemoveRecipient={portal.removeRecipient}
            onSave={portal.saveReportSettings}
            onSendTest={portal.sendTestReport}
          />
        )}
      </section>

      {portal.selected ? <TransactionDrawer row={portal.selected} onClose={() => portal.setSelected(null)} /> : null}
      <ToastStack toasts={portal.toasts} onDismiss={portal.dismissToast} />
    </main>
  );
}

export default App;
