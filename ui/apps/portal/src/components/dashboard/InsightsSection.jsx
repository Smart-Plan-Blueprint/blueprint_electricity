import { Gauge } from "lucide-react";
import { Section } from "@blueprint/ui";

export default function InsightsSection({ insights }) {
  const items = [
    ["Best time", insights?.best_window || "Watching transactions as they come in"],
    ["Problem signal", insights?.risk_signal || "No unusual failed payments in this view"],
    ["Next step", insights?.action || "Refresh when you want the newest transactions"]
  ];

  return (
    <Section title="What to watch" icon={Gauge}>
      <div className="insight-cards">
        {items.map(([label, value]) => (
          <article className="insight-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
    </Section>
  );
}
