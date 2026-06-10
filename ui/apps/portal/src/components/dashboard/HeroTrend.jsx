import { ArrowDown, ArrowUp } from "lucide-react";

export default function HeroTrend({ value }) {
  if (value === null || value === undefined || value === 0) {
    return null;
  }

  const up = value > 0;

  return (
    <span className={`hero-trend ${up ? "up" : "down"}`}>
      {up ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
      {Math.abs(value)}% vs prev
    </span>
  );
}
