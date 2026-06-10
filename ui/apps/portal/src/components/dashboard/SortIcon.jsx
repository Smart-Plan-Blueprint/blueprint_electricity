import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export default function SortIcon({ active, dir }) {
  if (!active) {
    return <ArrowUpDown size={13} className="sort-icon" />;
  }
  return dir === "asc" ? <ArrowUp size={13} className="sort-icon" /> : <ArrowDown size={13} className="sort-icon" />;
}
