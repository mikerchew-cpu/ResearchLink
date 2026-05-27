"use client";

import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { MALAYSIA_UNIVERSITIES } from "@/data/universities";
import toast from "react-hot-toast";

export default function WaitlistPage() {
  const { t } = useI18n();
  const [phone, setPhone] = useState("");
  const [university, setUniversity] = useState("");
  const [role, setRole] = useState("respondent");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  useState(() => {
    fetch("/api/waitlist?count=true")
      .then(r => r.json())
      .then(d => setCount(d.count || 0))
      .catch(() => {});
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.length < 10) {
      toast.error("Enter a valid Malaysian phone number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleaned, university, role }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
      toast.success("You're on the list!");
    } catch {
      toast.error(t("errors.general"));
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--color-background-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
          <div style={{ background: "var(--color-background-primary)", borderRadius: 16, border: "0.5px solid var(--color-border-tertiary)", padding: "40px 28px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>You're in!</h1>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: 0 }}>
              We'll WhatsApp you at <strong>+{phone.replace(/[^0-9]/g, "")}</strong> with rewards and survey opportunities.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-background-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 440, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: "var(--rl-teal)", marginBottom: 4 }}>ResearchLink</div>
          <div style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>Malaysia&apos;s Verified Student Research Exchange</div>
        </div>

        <div style={{ background: "var(--color-background-primary)", borderRadius: 16, border: "0.5px solid var(--color-border-tertiary)", padding: "32px 24px" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px" }}>Join the platform and get rewards</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 20px" }}>
            Complete FYP surveys, earn ZUS Coffee & TNG eWallet rewards.
          </p>

          {count > 0 && (
            <div style={{ background: "var(--rl-teal-light)", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "var(--rl-teal-dark)", textAlign: "center" }}>
              {count.toLocaleString()} students already signed up
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Phone number</label>
              <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="60123456789"
                style={{ width: "100%", padding: "9px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 13, color: "var(--color-text-primary)", background: "var(--color-background-secondary)" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>University (optional)</label>
              <select value={university} onChange={e => setUniversity(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 13, color: university ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>
                <option value="" disabled hidden>Select your university</option>
                <option value="">Prefer not to say</option>
                {MALAYSIA_UNIVERSITIES.map(u => (
                  <option key={u} value={u} style={{ color: "var(--color-text-primary)" }}>{u}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>I am a...</label>
              <select value={role} onChange={e => setRole(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 13, color: "var(--color-text-primary)" }}>
                <option value="respondent">Student respondent (earn rewards)</option>
                <option value="researcher">Researcher (post surveys)</option>
              </select>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "12px", background: loading ? "#9FE1CB" : "var(--rl-teal)", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Joining..." : "Join & Rewards"}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <a href="/auth/signin" style={{ fontSize: 12, color: "var(--rl-teal)", textDecoration: "none", fontWeight: 500 }}>
              Already have an account? Sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
