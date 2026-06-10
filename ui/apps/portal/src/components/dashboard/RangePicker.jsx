export default function RangePicker({ range, onSelectRange }) {
  const options = [
    ["today", "Today"],
    ["7d", "7 days"],
    ["30d", "30 days"],
    ["all", "All"]
  ];

  return (
    <div className="range-picker" role="group" aria-label="Date range">
      {options.map(([value, label]) => (
        <button
          key={value}
          type="button"
          className={range === value ? "active" : ""}
          onClick={() => onSelectRange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
