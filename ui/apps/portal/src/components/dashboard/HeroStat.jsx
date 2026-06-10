export default function HeroStat({ label, value, icon: Icon, tone = "sky" }) {
  return (
    <div className="hero-stat">
      {Icon ? (
        <span className={`hero-stat-icon tone-${tone}`}>
          <Icon size={20} strokeWidth={2.4} />
        </span>
      ) : null}
      <div className="hero-stat-text">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
