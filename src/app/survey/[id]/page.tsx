"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import toast from "react-hot-toast";

interface SurveyDetail {
  id: string; title: string; description?: string;
  survey_url?: string; status: string;
  response_count: number; target_responses: number;
  is_boosted: boolean; created_at: string;
  creator_name?: string; creator_university?: string;
  topic_tags?: string[]; already_responded?: boolean;
}

export default function SurveyDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { t } = useI18n();
  const [survey, setSurvey] = useState<SurveyDetail | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reported, setReported] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status === "authenticated" && params.id) fetchSurvey();
  }, [status, params.id, router]);

  async function fetchSurvey() {
    try {
      const res = await fetch(`/api/surveys/${params.id}`);
      const data = await res.json();
      setSurvey(data);
    } catch {}
  }

  async function handleRespond() {
    if (!survey?.survey_url) return;
    window.open(survey.survey_url, "_blank");
    toast.success("Complete the survey, then come back to claim points!");
  }

  async function handleReport() {
    if (!reportReason) return;
    try {
      const res = await fetch("/api/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ survey_id: params.id, reason: reportReason }),
      });
      if (!res.ok) throw new Error("Failed");
      setReported(true);
      toast.success(t("moderation.report_success"));
    } catch {
      toast.error(t("errors.general"));
    }
  }

  if (status === "loading" || !survey) return null;

  return (
    <AppShell user={session?.user ?? {}}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px 80px" }}>
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px" }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>{survey.title}</h1>
          {survey.description && <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 16px" }}>{survey.description}</p>}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {survey.topic_tags?.map(tag => (
              <span key={tag} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "var(--color-background-tertiary)", color: "var(--color-text-tertiary)" }}>{tag}</span>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 4 }}>Progress</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span>{survey.response_count} / {survey.target_responses} responses</span>
              <span>{Math.round((survey.response_count / survey.target_responses) * 100)}%</span>
            </div>
            <div style={{ height: 6, background: "var(--color-background-tertiary)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, Math.round((survey.response_count / survey.target_responses) * 100))}%`, height: "100%", background: "var(--rl-teal)", borderRadius: 3 }} />
            </div>
          </div>

          {survey.survey_url && !survey.already_responded && (
            <button onClick={handleRespond}
              style={{ width: "100%", padding: "12px", background: "var(--rl-teal)", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>
              {t("feed.respond_btn")}
            </button>
          )}

          {survey.already_responded && (
            <div style={{ background: "var(--rl-teal-light)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "var(--rl-teal-dark)", textAlign: "center" }}>
              {t("feed.responded_btn")}
            </div>
          )}

          {/* Report button */}
          <button onClick={() => setShowReport(!showReport)}
            style={{ fontSize: 11, color: "var(--color-text-tertiary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            {t("moderation.report_btn")}
          </button>

          {showReport && !reported && (
            <div style={{ marginTop: 12, padding: "14px", background: "var(--color-background-secondary)", borderRadius: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{t("moderation.report_title")}</div>
              <select value={reportReason} onChange={e => setReportReason(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 6, fontSize: 12, marginBottom: 8 }}>
                <option value="">Select a reason</option>
                {Object.entries(t("moderation.report_reasons")).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <button onClick={handleReport} disabled={!reportReason}
                style={{ padding: "6px 14px", background: "var(--rl-coral)", color: "white", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: reportReason ? "pointer" : "not-allowed" }}>
                Submit report
              </button>
            </div>
          )}

          {reported && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--rl-teal-light)", borderRadius: 8, fontSize: 12, color: "var(--rl-teal-dark)" }}>
              {t("moderation.report_success")}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
