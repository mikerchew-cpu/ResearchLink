"use client";

import Link from "next/link";
import { useI18n } from "./I18nProvider";

interface SurveyCardProps {
  id: string;
  title: string;
  description?: string;
  topic_tags?: string[];
  is_boosted?: boolean;
  target_responses?: number;
  response_count?: number;
  points?: number;
  estimated_minutes?: number;
  university?: string;
  faculty?: string;
  year_of_study?: string;
  creator_name?: string;
}

export default function SurveyCard({
  id, title, description, topic_tags, is_boosted,
  target_responses, response_count, points, estimated_minutes,
  university, faculty, year_of_study, creator_name,
}: SurveyCardProps) {
  const { t } = useI18n();
  const progress = target_responses && target_responses > 0
    ? Math.min(100, Math.round(((response_count || 0) / target_responses) * 100))
    : 0;

  return (
    <Link href={`/survey/${id}`} style={{ textDecoration: "none" }}>
      <div style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: 12, padding: "16px 18px",
        transition: "box-shadow 0.15s", cursor: "pointer",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              {is_boosted && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 8px",
                  background: "var(--rl-teal-light)", color: "var(--rl-teal-dark)",
                  borderRadius: 20,
                }}>
                  {t("feed.boosted_badge")}
                </span>
              )}
              <h3 style={{
                fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)",
                margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{title}</h3>
            </div>
            {description && (
              <p style={{
                fontSize: 12, color: "var(--color-text-secondary)",
                margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{description}</p>
            )}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--rl-teal)", whiteSpace: "nowrap", marginLeft: 12 }}>
            +{points || 0} pts
          </div>
        </div>

        {/* Tags */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
          {topic_tags?.slice(0, 3).map((tag) => (
            <span key={tag} style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 20,
              background: "var(--color-background-tertiary)", color: "var(--color-text-tertiary)",
            }}>{tag}</span>
          ))}
          {university && (
            <span style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 20,
              background: "var(--color-background-info)", color: "var(--color-text-info)",
            }}>{university}</span>
          )}
        </div>

        {/* Progress bar */}
        {target_responses && target_responses > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--color-text-tertiary)", marginBottom: 4 }}>
              <span>{response_count || 0} / {target_responses} responses</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: 4, background: "var(--color-background-tertiary)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "var(--rl-teal)", borderRadius: 2 }} />
            </div>
          </div>
        )}

        {/* Meta */}
        <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 10, color: "var(--color-text-tertiary)" }}>
          {estimated_minutes && <span>~{estimated_minutes} min</span>}
          {creator_name && <span>by {creator_name}</span>}
          {faculty && <span>{faculty}</span>}
        </div>
      </div>
    </Link>
  );
}
