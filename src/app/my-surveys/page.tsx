"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import toast from "react-hot-toast";

interface MySurvey {
  id: string; title: string; status: string;
  response_count: number; target_responses: number;
  is_boosted: boolean; created_at: string;
  topic_tags?: string[];
}

export default function MySurveysPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [surveys, setSurveys] = useState<MySurvey[]>([]);
  const [showBoost, setShowBoost] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status === "authenticated") fetchSurveys();
  }, [status, router]);

  async function fetchSurveys() {
    try {
      const res = await fetch("/api/surveys/mine");
      const data = await res.json();
      setSurveys(data.surveys || []);
    } catch {}
  }

  async function handleBroadcast(surveyId: string) {
    toast.loading("Broadcasting...");
    try {
      const res = await fetch("/api/whatsapp-broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ survey_id: surveyId }),
      });
      const data = await res.json();
      toast.dismiss();
      if (res.ok) {
        toast.success(`WhatsApp sent to ${data.sent} of ${data.total} students`);
      } else {
        toast.error(data.error || "Broadcast failed");
      }
    } catch {
      toast.dismiss();
      toast.error(t("errors.general"));
    }
  }

  async function handleBoost(surveyId: string, tier: "basic" | "featured") {
    try {
      const res = await fetch("/api/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ survey_id: surveyId, tier }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.redirect_url) window.location.href = data.redirect_url;
      else toast.success("Survey boosted!");
    } catch {
      toast.error(t("errors.general"));
    }
  }

  if (status === "loading") return null;

  return (
    <AppShell user={session?.user ?? {}} activePage="my-surveys">
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 2px" }}>{t("nav.my_surveys")}</h1>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>{surveys.length} surveys</p>
          </div>
          <Link href="/post" style={{ padding: "8px 16px", background: "var(--rl-teal)", color: "white", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
            + New survey
          </Link>
        </div>

        {surveys.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--color-text-tertiary)", fontSize: 13 }}>
            No surveys yet. Post your first FYP survey!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {surveys.map((survey) => (
              <div key={survey.id} style={{
                background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: 12, padding: "16px 18px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <Link href={`/survey/${survey.id}`} style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", textDecoration: "none" }}>{survey.title}</Link>
                    <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "var(--color-background-tertiary)", color: "var(--color-text-tertiary)" }}>{survey.status}</span>
                      {survey.is_boosted && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "var(--rl-teal-light)", color: "var(--rl-teal-dark)" }}>Boosted</span>}
                      {survey.topic_tags?.slice(0, 2).map(tag => (
                        <span key={tag} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "var(--color-background-info)", color: "var(--color-text-info)" }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--rl-teal)", whiteSpace: "nowrap" }}>
                    {survey.response_count}/{survey.target_responses}
                  </div>
                </div>

                {/* Progress */}
                <div style={{ height: 4, background: "var(--color-background-tertiary)", borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{
                    width: `${Math.min(100, Math.round((survey.response_count / survey.target_responses) * 100))}%`,
                    height: "100%", background: "var(--rl-teal)", borderRadius: 2,
                  }} />
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {survey.status === "active" && (
                    <button onClick={() => handleBroadcast(survey.id)}
                      style={{ fontSize: 11, color: "var(--rl-teal)", background: "none", border: "0.5px solid var(--rl-teal)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                      Broadcast WhatsApp
                    </button>
                  )}
                  {!survey.is_boosted && survey.status === "active" && (
                    <button onClick={() => setShowBoost(showBoost === survey.id ? null : survey.id)}
                      style={{ fontSize: 11, color: "var(--rl-teal)", background: "none", border: "0.5px solid var(--rl-teal)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                      Boost
                    </button>
                  )}
                </div>

                {showBoost === survey.id && (
                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <button onClick={() => handleBoost(survey.id, "basic")} style={{ flex: 1, padding: "8px", background: "var(--rl-teal)", color: "white", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      Boost Basic - RM 20
                    </button>
                    <button onClick={() => handleBoost(survey.id, "featured")} style={{ flex: 1, padding: "8px", background: "var(--rl-purple)", color: "white", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      Boost Featured - RM 50
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
