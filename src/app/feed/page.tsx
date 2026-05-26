"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import SurveyCard from "@/components/SurveyCard";
import FeedFilters from "@/components/FeedFilters";
import StatsBar from "@/components/StatsBar";
import ConsentGate from "@/components/ConsentGate";
import { useI18n } from "@/components/I18nProvider";

interface Survey {
  id: string; title: string; description?: string;
  topic_tags?: string[]; is_boosted?: boolean;
  target_responses?: number; response_count?: number;
  points?: number; estimated_minutes?: number;
  university?: string; faculty?: string; year_of_study?: string;
  creator_name?: string; creator_id: string;
}

export default function FeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [activeTag, setActiveTag] = useState("");
  const [showConsent, setShowConsent] = useState(false);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status === "authenticated") {
      if (!session?.user?.has_consented) setShowConsent(true);
      const hour = new Date().getHours();
      if (hour < 12) setGreeting(t("feed.greeting_morning", { name: session?.user?.name || "" }));
      else if (hour < 18) setGreeting(t("feed.greeting_afternoon", { name: session?.user?.name || "" }));
      else setGreeting(t("feed.greeting_evening", { name: session?.user?.name || "" }));
      fetchSurveys();
    }
  }, [status, session, router, t]);

  async function fetchSurveys(tag?: string) {
    const params = new URLSearchParams();
    if (tag) params.set("tag", tag);
    try {
      const res = await fetch(`/api/surveys?${params}`);
      const data = await res.json();
      setSurveys(data.surveys || []);
      if (data.tags) setTags(data.tags);
    } catch {}
  }

  function handleTagChange(tag: string) {
    setActiveTag(tag);
    fetchSurveys(tag);
  }

  if (status === "loading") return null;

  return (
    <AppShell user={session?.user ?? {}} activePage="feed">
      {showConsent && <ConsentGate onComplete={() => setShowConsent(false)} />}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 80px" }}>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 2px" }}>{greeting}</h1>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>
            {session?.user?.university}
          </p>
        </div>

        <StatsBar
          credits={session?.user?.credit_balance}
          points={session?.user?.points_balance}
        />

        <FeedFilters tags={tags} activeTag={activeTag} onTagChange={handleTagChange} />

        {surveys.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--color-text-tertiary)", fontSize: 13 }}>
            {t("feed.no_surveys")}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {surveys.map((survey) => (
              <SurveyCard key={survey.id} {...survey} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
