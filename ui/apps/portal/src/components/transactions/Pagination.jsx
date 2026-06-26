import { ChevronLeft, ChevronRight } from "lucide-react";

function pageItems(current, last) {
  const items = [1];
  const from = Math.max(2, current - 1);
  const to = Math.min(last - 1, current + 1);

  if (from > 2) items.push("gap-start");
  for (let page = from; page <= to; page += 1) items.push(page);
  if (to < last - 1) items.push("gap-end");
  if (last > 1) items.push(last);

  return items;
}

export default function Pagination({ meta, loading, onPage }) {
  if (!meta || meta.last_page <= 1) {
    return null;
  }

  const { current_page: current, last_page: last } = meta;
  const busy = loading === "reports";
  const items = pageItems(current, last);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="pagination__nav"
        disabled={busy || current <= 1}
        onClick={() => onPage(current - 1)}
      >
        <ChevronLeft size={16} />
        Previous
      </button>

      <div className="pagination__pages">
        {items.map((item) =>
          typeof item === "number" ? (
            <button
              key={item}
              type="button"
              className={`pagination__page${item === current ? " is-active" : ""}`}
              disabled={busy}
              aria-current={item === current ? "page" : undefined}
              onClick={() => onPage(item)}
            >
              {item}
            </button>
          ) : (
            <span key={item} className="pagination__ellipsis">…</span>
          )
        )}
      </div>

      <button
        type="button"
        className="pagination__nav"
        disabled={busy || current >= last}
        onClick={() => onPage(current + 1)}
      >
        Next
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
