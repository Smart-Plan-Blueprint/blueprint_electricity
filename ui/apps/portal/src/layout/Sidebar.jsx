import {
  Building2,
  ChartLine,
  FileSearch,
  LayoutDashboard,
  LogOut,
  Mail,
  Phone,
  PlugZap,
  SlidersHorizontal,
} from "lucide-react";
import { StatusBadge } from "@blueprint/ui";
import { demoMode } from "../config/reporting";
import NavButton from "../components/common/NavButton";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "reports", label: "Reports", icon: ChartLine },
  { id: "transactions", label: "Transactions", icon: FileSearch },
  { id: "airtime", label: "Airtime", icon: Phone },
  { id: "merchants", label: "Merchants", icon: Building2 },
  { id: "email", label: "Email Reports", icon: Mail },
];

const SERVICE_FILTERS = [
  { value: "", label: "All services" },
  { value: "electricity", label: "Electricity" },
  { value: "airtime", label: "Airtime" },
];

function serviceLabel(value) {
  return SERVICE_FILTERS.find((item) => item.value === value)?.label || SERVICE_FILTERS[0].label;
}

export default function Sidebar({
  activeView,
  onViewChange,
  serviceFilter = "",
  onServiceFilterChange,
  session,
  onLogout
}) {
  const dataStatus = demoMode ? "DEMO DATA" : "LIVE DATA";
  const userName = session.name || session.source || "Reporting user";
  const activeItem = NAV_ITEMS.find((item) => item.id === activeView) || NAV_ITEMS[0];

  return (
    <aside className="sp-sidebar">
      <div className="sp-sidebar__brand">
        <div className="sp-sidebar__mark">
          <PlugZap size={20} />
        </div>
        <div className="sp-sidebar__brand-text">
          <p className="sp-sidebar__eyebrow">Smart Plan Blueprint</p>
          <h1>Reporting Portal</h1>
        </div>
      </div>

      <div className="sp-sidebar__active-card">
        <span className="sp-sidebar__active-bar" />
        <p className="sp-sidebar__eyebrow">Active workspace</p>
        <strong>{activeItem.label}</strong>
        <div className="sp-sidebar__active-status">
          <span>{demoMode ? "Demo data" : "Live data"}</span>
          <StatusBadge status={dataStatus} />
        </div>
      </div>

      <div className="sp-sidebar__service-filter">
        <label htmlFor="global-service-filter">
          <SlidersHorizontal size={14} aria-hidden="true" />
          Service filter
        </label>
        <select
          id="global-service-filter"
          value={serviceFilter}
          onChange={(event) => onServiceFilterChange?.(event.target.value)}
          aria-label="Global service filter"
        >
          {SERVICE_FILTERS.map((item) => (
            <option key={item.value || "all"} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <small>{serviceLabel(serviceFilter)} applied across reports.</small>
      </div>

      <nav className="sp-sidebar__nav" aria-label="Main navigation">
        <p className="sp-sidebar__nav-label">Navigation</p>
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.id}
            active={activeView === item.id}
            icon={item.icon}
            onClick={() => onViewChange(item.id)}
          >
            {item.label}
          </NavButton>
        ))}
      </nav>

      <div className="sp-sidebar__footer">
        <div className="sp-sidebar__user">
          <div className="sp-sidebar__avatar">{userName.charAt(0).toUpperCase()}</div>
          <div className="sp-sidebar__user-text">
            <strong>{userName}</strong>
            <small>{session.email || (demoMode ? "Demo session" : "Signed in")}</small>
          </div>
        </div>

        <button type="button" className="sp-sidebar__signout" onClick={onLogout}>
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
