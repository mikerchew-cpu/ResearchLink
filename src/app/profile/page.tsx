"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [researchConsent, setResearchConsent] = useState(true);
  const [brandConsent, setBrandConsent] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralStats, setReferralStats] = useState({ count: 0, points: 0 });
  const [telephone, setTelephone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/signin"); return; }
    if (status === "authenticated") {
      setResearchConsent(true);
      setBrandConsent(false);
      setTelephone(session?.user?.telephone_no || "");
      fetch("/api/referral").then(r => r.json()).then(d => {
        setReferralCode(d.code || "");
        setReferralStats({ count: d.count || 0, points: d.points || 0 });
      }).catch(() => {});
    }
  }, [status, router, session]);

  async function handleSaveProfile() {
    setProfileSaving(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telephone_no: telephone }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(t("common.success"));
      await update();
    } catch {
      toast.error(t("errors.general"));
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleSaveConsent() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/consent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent_research: researchConsent, consent_brand: brandConsent }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(t("common.success"));
      await update();
    } catch {
      toast.error(t("errors.general"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch("/api/profile/delete", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Account deleted");
      router.push("/");
    } catch {
      toast.error(t("errors.general"));
    }
  }

  async function handleDownload() {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "researchlink-data.json"; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("errors.general"));
    }
  }

  async function copyReferral() {
    if (referralCode) {
      await navigator.clipboard.writeText(`${window.location.origin}/?ref=${referralCode}`);
      toast.success(t("profile.referral_copy_btn") + "!");
    }
  }

  if (status === "loading") return null;

  return (
    <AppShell user={session?.user ?? {}} activePage="profile">
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px 80px" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px" }}>{t("profile.title")}</h1>

        {/* Profile info */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            {session?.user?.image ? (
              <img src={session.user.image} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--rl-teal-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👤</div>
            )}
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{session?.user?.name}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{session?.user?.email}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{session?.user?.university} · {session?.user?.programme}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "10px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--rl-teal)" }}>{session?.user?.credit_balance || 0}</div>
              <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{t("feed.stats.credits")}</div>
            </div>
            <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "10px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--rl-purple)" }}>{session?.user?.points_balance || 0}</div>
              <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{t("feed.stats.points")}</div>
            </div>
          </div>
        </div>

        {/* WhatsApp Telephone */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px", marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>WhatsApp Notifications</h2>
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "0 0 12px" }}>
            Add your phone number to receive survey broadcasts via WhatsApp
          </p>
          <input
            type="tel"
            value={telephone}
            onChange={e => setTelephone(e.target.value)}
            placeholder="e.g. 60123456789"
            style={{ width: "100%", padding: "10px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 13, marginBottom: 10, boxSizing: "border-box" }}
          />
          <button onClick={handleSaveProfile} disabled={profileSaving}
            style={{ padding: "8px 20px", background: "var(--rl-teal)", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {profileSaving ? t("common.loading") : "Save number"}
          </button>
        </div>

        {/* PDPA Consent */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px", marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>{t("profile.consent_section")}</h2>
          <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={researchConsent} onChange={e => setResearchConsent(e.target.checked)} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{t("profile.consent_research_label")}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{t("profile.consent_research_desc")}</div>
            </div>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={brandConsent} onChange={e => setBrandConsent(e.target.checked)} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{t("profile.consent_brand_label")}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{t("profile.consent_brand_desc")}</div>
            </div>
          </label>
          <button onClick={handleSaveConsent} disabled={saving}
            style={{ padding: "8px 20px", background: "var(--rl-teal)", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {saving ? t("common.loading") : t("common.save")}
          </button>
        </div>

        {/* Referral */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px", marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>{t("profile.referral_section")}</h2>
          <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginBottom: 2 }}>{t("profile.referral_code_label")}</div>
            <code style={{ fontSize: 16, fontWeight: 600 }}>{referralCode || "—"}</code>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={copyReferral} style={{ flex: 1, padding: "8px", background: "var(--rl-teal)", color: "white", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              {t("profile.referral_copy_btn")}
            </button>
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 8 }}>
            {t("profile.referral_stats", { count: referralStats.count, points: referralStats.points })}
          </div>
        </div>

        {/* Data rights */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px", marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>{t("profile.data_rights_section")}</h2>
          <button onClick={handleDownload}
            style={{ width: "100%", padding: "10px", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, fontSize: 12, cursor: "pointer", marginBottom: 8 }}>
            {t("profile.download_data_btn")}
          </button>
          <p style={{ fontSize: 10, color: "var(--color-text-tertiary)", margin: "0 0 12px" }}>{t("profile.download_data_desc")}</p>
          {!showDelete ? (
            <button onClick={() => setShowDelete(true)}
              style={{ padding: "8px 16px", background: "var(--rl-coral)", color: "white", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              {t("profile.delete_account_btn")}
            </button>
          ) : (
            <div style={{ background: "var(--color-background-danger)", borderRadius: 8, padding: "14px" }}>
              <p style={{ fontSize: 12, color: "var(--color-text-danger)", margin: "0 0 10px" }}>{t("profile.delete_account_warning")}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowDelete(false)} style={{ padding: "8px 16px", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 11, cursor: "pointer" }}>{t("common.cancel")}</button>
                <button onClick={handleDelete} style={{ padding: "8px 16px", background: "var(--rl-coral)", color: "white", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{t("common.confirm")}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
