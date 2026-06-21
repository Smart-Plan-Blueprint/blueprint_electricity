import {
  Building2,
  ChartLine,
  FileSearch,
  LayoutDashboard,
  LogOut,
  Mail,
  Phone,
  PlugZap,
  Zap,
} from "lucide-react";
import { StatusBadge } from "@blueprint/ui";
import { demoMode } from "../config/reporting";
import NavButton from "../components/common/NavButton";

export default function Sidebar({ activeView, onViewChange, session, onLogout }) {
  const dataStatus = demoMode ? "DEMO DATA" : "LIVE DATA";

  return (
    <aside className="sp-sidebar">
      <div className="sp-sidebar__top">
        <div className="sp-sidebar__brand">
          <div className="sp-sidebar__mark">
            <PlugZap size={21} />
          </div>

          <div>
            <strong>Smart Plan Blueprint</strong>
            <span>Airtime & electricity reporting</span>
          </div>
        </div>

        <div className="sp-sidebar__status-card">
          <div>
            <span>Reporting mode</span>
            <strong>{dataStatus}</strong>
          </div>

          <StatusBadge status={dataStatus} />
        </div>
      </div>

      <nav className="sp-sidebar__nav" aria-label="Main navigation">
        <NavButton
          active={activeView === "dashboard"}
          icon={LayoutDashboard}
          onClick={() => onViewChange("dashboard")}
        >
          Dashboard
        </NavButton>

        <NavButton
          active={activeView === "reports"}
          icon={ChartLine}
          onClick={() => onViewChange("reports")}
        >
          Reports
        </NavButton>

        <NavButton
          active={activeView === "transactions"}
          icon={FileSearch}
          onClick={() => onViewChange("transactions")}
        >
          Transactions
        </NavButton>

        <NavButton
          active={activeView === "airtime"}
          icon={Phone}
          onClick={() => onViewChange("airtime")}
        >
          Airtime
        </NavButton>

        <NavButton
          active={activeView === "merchants"}
          icon={Building2}
          onClick={() => onViewChange("merchants")}
        >
          Merchants
        </NavButton>

        <NavButton
          active={activeView === "email"}
          icon={Mail}
          onClick={() => onViewChange("email")}
        >
          Email Reports
        </NavButton>
      </nav>

      <div className="sp-sidebar__mini-panel" aria-label="Sales reporting coverage">
        <div>
          <Zap size={15} />
          <span>Electricity sales</span>
        </div>

        <div>
          <Phone size={15} />
          <span>Airtime sales</span>
        </div>

        <div>
          <ChartLine size={15} />
          <span>Daily revenue</span>
        </div>
      </div>

      <div className="sp-sidebar__session">
        <div className="sp-sidebar__session-user">
          <span>Signed in as</span>
          <strong>{session.name || session.source || "Reporting user"}</strong>
          {session.email ? <small>{session.email}</small> : null}
        </div>

        <button type="button" onClick={onLogout}>
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
