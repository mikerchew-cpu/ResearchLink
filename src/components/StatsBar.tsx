"use client";

import { useI18n } from "./I18nProvider";

interface StatsBarProps {
  credits?: number;
  points?: number;
  completed?: number;
  activeSurveys?: number;
}

export default function StatsBar({ credits = 0, points = 0, completed = 0, activeSurveys = 0 }: StatsBarProps) {
  const { t } = useI18n();

  const items = [
    { label: t("feed.stats.credits"), value: credits, color: "var(--rl-teal)" },
    { label: t("feed.stats.points"), value: points, color: "var(--rl-purple)" },
    { label: t("feed.stats.completed"), value: completed, color: "var(--rl-amber)" },
    { label: t("feed.stats.active_surveys"), value: activeSurveys, color: "var(--rl-coral)" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
      {items.map(({ label, value, color }) => (
        <div key={label} style={{
          background: "var(--color-background-primary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: 10, padding: "12px 14px", textAlign: "center",
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginTop: 4 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}
