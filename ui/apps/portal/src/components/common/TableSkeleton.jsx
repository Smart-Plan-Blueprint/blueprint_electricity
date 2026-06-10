export default function TableSkeleton({ compact }) {
  const cols = compact ? 6 : 7;
  return (
    <div className="table-wrap">
      <div className="skeleton-table">
        {Array.from({ length: 6 }).map((_, rowIndex) => (
          <div className="skeleton-row" key={rowIndex}>
            {Array.from({ length: cols }).map((__, cellIndex) => (
              <span className="skeleton-cell" key={cellIndex} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
