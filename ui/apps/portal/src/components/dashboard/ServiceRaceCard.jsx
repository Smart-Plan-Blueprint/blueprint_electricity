import { Phone, PlugZap, Trophy } from "lucide-react";
import { formatMoney } from "../../utils/formatters";

function bar(value, max) {
  return max ? Math.round((value / max) * 100) : 0;
}

export default function ServiceRaceCard({ stats, airtimeReports, isLoading }) {
  const elecCount = stats.totalCount ?? 0;
  const airCount = airtimeReports?.summary?.total ?? 0;
  const elecSuccess = stats.successCount ?? 0;
  const airSuccess = airtimeReports?.summary?.successful ?? 0;
  const elecRate = elecCount ? Math.round((elecSuccess / elecCount) * 100) : 0;
  const airRate = airCount ? Math.round((airSuccess / airCount) * 100) : 0;
  const elecRevenue = stats.totalAmount ?? 0;

  const maxCount = Math.max(elecCount, airCount, 1);

  // winner by count volume
  const leader =
    elecCount === airCount ? "tie"
    : elecCount > airCount ? "electricity"
    : "airtime";

  return (
    <div className="service-race-card">
      <div className="race-header">
        <span className="race-title">Service performance</span>
        {leader !== "tie" && (
          <span className={`race-winner-badge race-winner-${leader}`}>
            <Trophy size={12} />
            {leader === "electricity" ? "Electricity leading" : "Airtime leading"}
          </span>
        )}
        {leader === "tie" && <span className="race-winner-badge race-winner-tie">Tied</span>}
      </div>

      <div className="race-rows">
        {/* Electricity */}
        <div className={`race-service${leader === "electricity" ? " race-service--leader" : ""}`}>
          <div className="race-service-meta">
            <span className="race-service-icon race-icon-elec"><PlugZap size={14} /></span>
            <span className="race-service-name">Electricity</span>
            <span className="race-service-count">{isLoading ? "—" : elecCount} txns</span>
            <span className="race-service-rate">{elecRate}% success</span>
            <span className="race-service-revenue">{formatMoney(elecRevenue)}</span>
          </div>
          <div className="race-bar-track">
            <div className="race-bar race-bar-elec" style={{ width: `${bar(elecCount, maxCount)}%` }} />
          </div>
        </div>

        {/* Airtime */}
        <div className={`race-service${leader === "airtime" ? " race-service--leader" : ""}`}>
          <div className="race-service-meta">
            <span className="race-service-icon race-icon-air"><Phone size={14} /></span>
            <span className="race-service-name">Airtime</span>
            <span className="race-service-count">{airCount} txns</span>
            <span className="race-service-rate">{airRate}% success</span>
            <span className="race-service-revenue">—</span>
          </div>
          <div className="race-bar-track">
            <div className="race-bar race-bar-air" style={{ width: `${bar(airCount, maxCount)}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
