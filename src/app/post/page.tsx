"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import toast from "react-hot-toast";

export default function PostSurveyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [surveyUrl, setSurveyUrl] = useState("");
  const [targetResponses, setTargetResponses] = useState(100);
  const [targetFaculty, setTargetFaculty] = useState("");
  const [targetYear, setTargetYear] = useState("");
  const [halalCompliant, setHalalCompliant] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tokenUrl, setTokenUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const requiredCredits = 5;
  const hasCredits = (session?.user?.credit_balance || 0) >= requiredCredits;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
  }, [status, router]);

  async function handleSubmit() {
    if (!title || !surveyUrl) { toast.error("Title and survey link are required"); return; }
    if (!halalCompliant) { toast.error("You must confirm halal compliance"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, survey_url: surveyUrl,
          target_responses: targetResponses,
          target_faculty: targetFaculty || null,
          target_year: targetYear || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to post survey");
      }
      const data = await res.json();
      setTokenUrl(data.token_url || "");
      setStep(3);
      toast.success("Survey posted! Set up your completion token.");
    } catch (err: any) {
      toast.error(err.message || t("errors.general"));
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") return null;

  return (
    <AppShell user={session?.user ?? {}} activePage="post">
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px 80px" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>{t("post_survey.title")}</h1>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 20px" }}>
          {t("post_survey.subtitle", { required: requiredCredits, current: session?.user?.credit_balance || 0 })}
        </p>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: s <= step ? "var(--rl-teal)" : "var(--color-border-tertiary)",
            }} />
          ))}
        </div>

        {step === 1 && (
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px" }}>
            {!hasCredits && (
              <div style={{ background: "var(--color-background-danger)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "var(--color-text-danger)" }}>
                {t("post_survey.not_enough_message", { needed: requiredCredits - (session?.user?.credit_balance || 0) })}
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{t("post_survey.form.title_label")}</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t("post_survey.form.title_placeholder")} style={{ width: "100%", padding: "9px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 13 }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{t("post_survey.form.description_label")}</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t("post_survey.form.description_placeholder")} rows={3} style={{ width: "100%", padding: "9px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 13, resize: "vertical" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{t("post_survey.form.url_label")}</label>
              <input value={surveyUrl} onChange={e => setSurveyUrl(e.target.value)} placeholder={t("post_survey.form.url_placeholder")} style={{ width: "100%", padding: "9px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 13 }} />
            </div>
            <button onClick={() => setStep(2)} disabled={!hasCredits || !title || !surveyUrl}
              style={{ width: "100%", padding: "11px", background: (hasCredits && title && surveyUrl) ? "var(--rl-teal)" : "var(--color-border-tertiary)", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: (hasCredits && title && surveyUrl) ? "pointer" : "not-allowed" }}>
              {t("common.next")}
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px" }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{t("post_survey.form.target_responses_label")}</label>
              <input type="number" value={targetResponses} onChange={e => setTargetResponses(Number(e.target.value))} min={10} max={1000} style={{ width: "100%", padding: "9px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 13 }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{t("post_survey.form.target_faculty_label")}</label>
              <input value={targetFaculty} onChange={e => setTargetFaculty(e.target.value)} placeholder={t("post_survey.form.target_faculty_placeholder")} style={{ width: "100%", padding: "9px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 13 }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{t("post_survey.form.target_year_label")}</label>
              <select value={targetYear} onChange={e => setTargetYear(e.target.value)} style={{ width: "100%", padding: "9px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 13 }}>
                <option value="">Any year</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
                <option value="postgrad">Postgraduate</option>
              </select>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, cursor: "pointer" }}>
              <input type="checkbox" checked={halalCompliant} onChange={e => setHalalCompliant(e.target.checked)} />
              <span style={{ fontSize: 12 }}>{t("post_survey.form.halal_label")}</span>
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setStep(1)} style={{ padding: "11px 20px", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{t("common.back")}</button>
              <button onClick={handleSubmit} disabled={submitting || !halalCompliant}
                style={{ flex: 1, padding: "11px", background: submitting ? "#9FE1CB" : "var(--rl-teal)", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer" }}>
                {submitting ? t("common.loading") : t("post_survey.form.submit_btn", { credits: requiredCredits })}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px" }}>
            <div style={{ background: "var(--rl-teal-light)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "var(--rl-teal-dark)" }}>
              {t("post_survey.form.moderation_note")}
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>{t("post_survey.token_instructions.title")}</h3>
            <ol style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.8, paddingLeft: 16, margin: "0 0 16px" }}>
              {[1, 2, 3, 4].map((i) => (
                <li key={i}>{t(`post_survey.token_instructions.step${i}`)}</li>
              ))}
            </ol>
            <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginBottom: 4 }}>Token URL</div>
              <code style={{ fontSize: 11, wordBreak: "break-all" }}>{tokenUrl}</code>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(tokenUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ width: "100%", padding: "11px", background: "var(--rl-teal)", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {copied ? t("post_survey.form.token_copied") : t("post_survey.form.copy_token_url")}
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
