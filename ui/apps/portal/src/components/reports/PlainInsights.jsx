import { ShieldCheck } from "lucide-react";
import { Section } from "@blueprint/ui";
import { plainInsights } from "../../utils/stats";

export default function PlainInsights({ stats }) {
  const insights = plainInsights(stats);

  return (
    <Section title="What this report means" icon={ShieldCheck}>
      <div className="plain-insights">
        {insights.map((insight) => (
          <article className={`plain-insight ${insight.tone}`} key={insight.title}>
            <span>{insight.title}</span>
            <strong>{insight.message}</strong>
          </article>
        ))}
      </div>
    </Section>
  );
}
