import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ meta, loading, onPage }) {
  if (!meta || meta.last_page <= 1) {
    return null;
  }

  const { current_page: current, last_page: last, total } = meta;
  const busy = loading === "reports";

  return (
    <div className="pagination">
      <span>Page {current} of {last} · {total} total</span>
      <div className="pagination-controls">
        <button type="button" disabled={busy || current <= 1} onClick={() => onPage(current - 1)}>
          <ChevronLeft size={16} />
          Prev
        </button>
        <button type="button" disabled={busy || current >= last} onClick={() => onPage(current + 1)}>
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
