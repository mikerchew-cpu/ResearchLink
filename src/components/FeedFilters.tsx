"use client";

import { useI18n } from "./I18nProvider";

interface FeedFiltersProps {
  tags: string[];
  activeTag: string;
  onTagChange: (tag: string) => void;
}

export default function FeedFilters({ tags, activeTag, onTagChange }: FeedFiltersProps) {
  const { t } = useI18n();

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
      <button
        onClick={() => onTagChange("")}
        style={{
          padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
          border: "0.5px solid var(--color-border-tertiary)",
          background: !activeTag ? "var(--rl-teal)" : "var(--color-background-primary)",
          color: !activeTag ? "white" : "var(--color-text-secondary)",
          cursor: "pointer",
        }}
      >
        {t("feed.filter_all")}
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onTagChange(tag)}
          style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
            border: "0.5px solid var(--color-border-tertiary)",
            background: activeTag === tag ? "var(--rl-teal)" : "var(--color-background-primary)",
            color: activeTag === tag ? "white" : "var(--color-text-secondary)",
            cursor: "pointer",
          }}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
