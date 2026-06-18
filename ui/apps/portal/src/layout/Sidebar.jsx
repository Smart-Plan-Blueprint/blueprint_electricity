import { BarChart3, Building2, FileSearch, LayoutDashboard, LogOut, Mail, Phone, PlugZap } from "lucide-react";
import { StatusBadge } from "@blueprint/ui";
import { demoMode } from "../config/reporting";
import NavButton from "../components/common/NavButton";

export default function Sidebar({ activeView, onViewChange, session, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="brand-lockup">
        <div className="brand-mark"><PlugZap size={22} /></div>
        <div>
          <strong>Smart Plan Blueprint</strong>
          <span>Reporting Portal</span>
        </div>
      </div>

      <nav className="nav-list" aria-label="Main navigation">
        <NavButton active={activeView === "dashboard"} icon={LayoutDashboard} onClick={() => onViewChange("dashboard")}>Dashboard</NavButton>
        <NavButton active={activeView === "reports"} icon={BarChart3} onClick={() => onViewChange("reports")}>Reports</NavButton>
        <NavButton active={activeView === "transactions"} icon={FileSearch} onClick={() => onViewChange("transactions")}>Transactions</NavButton>
        <NavButton active={activeView === "airtime"} icon={Phone} onClick={() => onViewChange("airtime")}>Airtime</NavButton>
        <NavButton active={activeView === "merchants"} icon={Building2} onClick={() => onViewChange("merchants")}>Merchants</NavButton>
        <NavButton active={activeView === "email"} icon={Mail} onClick={() => onViewChange("email")}>Email Reports</NavButton>
      </nav>

      <div className="session-card">
        <StatusBadge status={demoMode ? "DEMO DATA" : "LIVE DATA"} />
        <span>{session.name || session.source}</span>
        {session.email ? <small className="session-email">{session.email}</small> : null}
        <button type="button" onClick={onLogout}>
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
