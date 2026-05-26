"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useI18n } from "./I18nProvider";
import toast from "react-hot-toast";

interface ConsentGateProps {
  onComplete: () => void;
}

export default function ConsentGate({ onComplete }: ConsentGateProps) {
  const { t } = useI18n();
  const { data: session, update } = useSession();
  const [researchConsent, setResearchConsent] = useState(true);
  const [brandConsent, setBrandConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!researchConsent && !brandConsent) {
      toast.error(t("auth.consent_required"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile/consent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consent_research: researchConsent,
          consent_brand: brandConsent,
        }),
      });
      if (!res.ok) throw new Error("Failed to save consent");
      toast.success(t("common.success"));
      await update();
      onComplete();
    } catch {
      toast.error(t("errors.general"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.4)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        maxWidth: 440, width: "100%", background: "var(--color-background-primary)",
        borderRadius: 16, padding: "28px 24px",
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>{t("auth.consent_title")}</h2>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 20px" }}>{t("auth.consent_subtitle")}</p>

        <div style={{ background: "var(--color-background-info)", borderRadius: 10, padding: "12px 14px", marginBottom: 20, fontSize: 12, color: "var(--color-text-info)" }}>
          {t("auth.consent_pdpa")}
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--color-background-secondary)", borderRadius: 10, marginBottom: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={researchConsent} onChange={e => setResearchConsent(e.target.checked)} style={{ width: 18, height: 18 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{t("auth.consent_research")}</div>
          </div>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--color-background-secondary)", borderRadius: 10, marginBottom: 20, cursor: "pointer" }}>
          <input type="checkbox" checked={brandConsent} onChange={e => setBrandConsent(e.target.checked)} style={{ width: 18, height: 18 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{t("auth.consent_brand")}</div>
          </div>
        </label>

        <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "0 0 16px" }}>{t("auth.consent_note")}</p>

        <button onClick={handleSave} disabled={saving}
          style={{
            width: "100%", padding: "12px", background: "var(--rl-teal)", color: "white",
            border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>
          {saving ? t("common.loading") : t("auth.consent_save")}
        </button>
      </div>
    </div>
  );
}
